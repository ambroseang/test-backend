import { Injectable } from "@nestjs/common";
import {
  Assignment,
  Course,
  CourseConfig,
  CourseRun,
  CourseSegment,
  DeliveryMode,
  FiscalYear,
  Prisma,
  Programme,
  Status,
} from "@prisma/client";
import { CellValue, Workbook } from "exceljs";
import { CourseService } from "src/course/course.service";
import { DataIngestionService } from "../data-ingestion/data-ingestion.service";
import { FiscalYearService } from "src/fiscal-year/fiscal-year.service";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { Calendar, Year } from "src/interfaces/calendar.interface";
import {
  BlackoutDates,
  LowManpowerDate,
  LowManpowerDates,
} from "src/interfaces/new_schedule_inputs.interface";
import { SchedulingIssue } from "src/interfaces/scheduling_failures.interface";
import { Availabilities } from "src/interfaces/availabilities.interface";
import { fyDto, HolidayDto, ScheduleDto, trainerFilterDto } from "./dto";
import { SchedulerHelper } from "./scheduler.helper";
import { FilterDto } from "./dto/filter.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { ManualDto } from "./dto/manual.dto";
import { GetCourseConfigDto } from "src/course/dto/get-course-config.dto";
import { TrainerService } from "src/trainer/trainer.service";
import { CalendarService } from "src/calendar/calendar.service";
import { AddItemsOnHoldDto } from "./dto/add-items-on-hold.dto";

interface formatted_date {
  programme_name: string;
  course_code: string;
  delivery_mode: DeliveryMode;
  end_time: string;
  start_time: string;
  segment: number;
  course_name: string;
  fy: string;
  run: number;
  trainersAssignmentResponse: Record<string, string>;
  trainerDeclineReason: Record<string, string>;
  status: Status;
  dates: Array<Date>;
}

@Injectable()
export class SchedulerService {
  constructor(
    private prisma: PrismaService,
    private readonly dataIngestionService: DataIngestionService,
    private readonly courseService: CourseService,
    private configService: ConfigService,
    private httpService: HttpService,
    private fiscalYearService: FiscalYearService,
    private helper: SchedulerHelper,
    private trainerService: TrainerService,
    private calendarService: CalendarService,
  ) {}

  calendar: Calendar;
  yearOne: number;
  yearTwo: number;
  availabilities: Availabilities = {};
  failures: SchedulingIssue[] = [];
  warnings: SchedulingIssue[] = [];

  async scheduleNew(
    file: Express.Multer.File,
    formData: ScheduleDto,
  ): Promise<any> {
    const parsedData = this.dataIngestionService
      .parseSchedulingExcel(file, formData.fiscalYear)
      .then(
        async ([
          courseInfoRowObjects,
          courseInfoValidationObjects,
          manualAdditionRowObjects,
          manualValidationObjects,
        ]) => {
          // todo: error handling
          if (
            courseInfoValidationObjects.size > 0 ||
            manualValidationObjects.size > 0
          ) {
            return { courseInfoValidationObjects, manualValidationObjects };
          }

          [this.yearOne, this.yearTwo] = formData.fiscalYear
            .split("-")
            .map(Number);

          const manyProgrammes: Array<Programme> =
            this.helper.constructManyProgramme(courseInfoRowObjects);
          await this.courseService.createManyProgrammes(manyProgrammes);

          const manyCourses: Array<Course> =
            this.helper.constructManyCourses(courseInfoRowObjects);
          await this.courseService.createManyCourses(manyCourses);

          const [manyCourseConfigs, coursesToGenerate, multiModuleToGenerate] =
            this.helper.constructManyCourseConfigs(
              courseInfoRowObjects,
              formData.fiscalYear,
            );
          await this.courseService.createManyCourseConfigs(manyCourseConfigs);

          const fyWhere = { fy: formData.fiscalYear };
          const blackoutPeriods: BlackoutDates =
            formData.blackoutPeriods === undefined
              ? {}
              : this.helper.parseBlackoutDates(formData.blackoutPeriods);
          const decreasedManpowerPeriods: LowManpowerDates =
            formData.decreasedManpowerPeriods === undefined
              ? {}
              : this.helper.parseLowManpowerDates(
                  formData.decreasedManpowerPeriods,
                );
          const updateFyData = this.helper.constructFyData(
            Number(formData.maxCourseRunsPerDay),
            blackoutPeriods,
            decreasedManpowerPeriods,
          );
          await this.fiscalYearService.patchFiscalYear({
            where: fyWhere,
            data: updateFyData,
          });

          this.initCalendar(
            Number(formData.maxCourseRunsPerDay),
            blackoutPeriods,
            decreasedManpowerPeriods,
          );
          this.availabilities = {};
          this.failures = [];
          this.warnings = [];

          // Fix Manual Addition Courses first
          await this.fixManualAdditionCourses(
            manyCourseConfigs,
            manualAdditionRowObjects,
          );

          await this.generateMultiModuleSchedule(multiModuleToGenerate);

          const [
            firstPriorityCourses,
            secondPriorityCourses,
          ]: CourseConfig[][] =
            this.helper.splitCoursesByPriority(coursesToGenerate);
          await this.generateSchedule(firstPriorityCourses);
          await this.generateSchedule(secondPriorityCourses);

          return {
            failures: this.failures,
            warnings: this.warnings,
          };
          // return this.calendar
        },
      );
    return parsedData;
  }

  private async generateMultiModuleSchedule(programmes: CourseConfig[][]) {
    const courseRuns: CourseRun[] = [];
    const courseSegments: CourseSegment[] = [];
    const assignments: Assignment[] = [];

    for (const programme of programmes) {
      const numModules: number = programme.length;
      const numRuns: number = programme[0].runs_per_year;
      let numModulesPerMonth: number;

      let numMonthsPerRun: number = Math.floor(12 / numRuns) + 2;
      if (numModules <= numMonthsPerRun) {
        numModulesPerMonth = 1;
      } else {
        numModulesPerMonth = 2;
      }

      numMonthsPerRun = Math.ceil(numModules / numModulesPerMonth);
      const monthOverlap: number =
        numRuns > 1
          ? Math.max(
              Math.ceil((numRuns * numMonthsPerRun - 12) / (numRuns - 1)),
              -1,
            )
          : 0;

      for (let r = 0; r < numRuns; r++) {
        let month: number = (3 + r * numMonthsPerRun - r * monthOverlap) % 12;
        for (const course of programme) {
          let year = Math.floor(month) < 3 ? this.yearTwo : this.yearOne;
          const avoidMonthStart: boolean = course.avoid_month_start,
            avoidMonthEnd: boolean = course.avoid_month_end;
          const numDays: number = course.days_per_run;
          const daysToAvoid: number[] = course.days_to_avoid.map((day) =>
            Number(day - 1),
          );
          const trainers: Prisma.JsonObject =
            course.trainers as Prisma.JsonObject;
          let prefWeeks: number[] = this.getPrefWeeks(
            year,
            Math.floor(month),
            avoidMonthStart,
            avoidMonthEnd,
          );
          if (numModulesPerMonth == 2) {
            const midIndex = Math.ceil(prefWeeks.length / 2);
            if (Math.floor(month) == month) {
              prefWeeks = prefWeeks.slice(0, midIndex);
            } else {
              prefWeeks = prefWeeks.slice(midIndex);
            }
          }
          let dates: Date[] = [];
          if (5 - daysToAvoid.length < numDays) {
            const failure: SchedulingIssue = {
              config: course,
              reasons: [
                "Too many days to avoid for given days per run (Days To Avoid & Days / Run config)",
              ],
            };
            this.failures.push(failure);
            continue;
          }

          let bestWeek: number = this.findBestWeekOfMonth(
            prefWeeks,
            year,
            Math.floor(month),
          );

          let bestDayToStart: number = this.findBestDayToStart(
            numDays,
            daysToAvoid,
            year,
            Math.floor(month),
            bestWeek,
            trainers,
            true,
          );
          if (bestDayToStart === undefined) {
            const { found, yy, mm, ww, dd } = this.seekForward(
              Math.floor(month),
              bestWeek,
              numDays,
              daysToAvoid,
              trainers,
              new Map(),
              true,
            );
            if (found) {
              (year = yy), (month = mm), (bestWeek = ww), (bestDayToStart = dd);
            } else {
              const failure: SchedulingIssue = {
                config: course,
                reasons: [`Unable to find fitting schedule for run ${r + 1}`],
              };
              this.failures.push(failure);
              continue;
            }
          }
          dates = this.helper.generateDatesFromWeek(
            year,
            Math.floor(month),
            bestWeek,
            bestDayToStart,
            numDays,
          );
          dates.forEach((date) => {
            this.updateTrainerAvailabilities(date, trainers, course, true);
            this.adjustCourseSlotsForDate(date, -1);
          });

          courseRuns.push(
            this.helper.constructCourseRun(
              course.course_name,
              course.fy,
              r + 1,
            ),
          );
          courseSegments.push(
            this.helper.constructCourseSegment(
              course.course_name,
              course.fy,
              r + 1,
              1,
              dates,
            ),
          );
          for (const trainer in trainers) {
            assignments.push(
              this.helper.constructAssignment(
                course.course_name,
                course.fy,
                r + 1,
                1,
                trainer,
              ),
            );
          }
          month = (month + 1 / numModulesPerMonth) % 12;
        }
      }
    }

    await this.courseService.createManyCourseRuns(courseRuns);
    await this.courseService.createManyCourseSegments(courseSegments);
    await this.courseService.createManyAssignments(assignments);
  }

  async manualAdd(file: Express.Multer.File, formData: ManualDto) {
    const [parsedData] = await this.dataIngestionService.parseManualAddExcel(
      file,
      formData.fiscalYear,
    );
    const [y1, y2] = formData.fiscalYear.split("-").map(Number);
    this.yearOne = y1;
    this.yearTwo = y2;
    const fyWhere = { fy: formData.fiscalYear };
    const fy = await this.fiscalYearService.getFiscalYear({ where: fyWhere });
    const blackoutPeriods = JSON.parse(JSON.stringify(fy.blackout_dates));
    const lowManpowerPeriods = JSON.parse(
      JSON.stringify(fy.low_manpower_dates),
    );

    const dayLimit = fy.day_limit;
    const blackoutDates: number[] = [];

    for (const period_name in blackoutPeriods) {
      const dates: string[] = blackoutPeriods[period_name];
      for (const date of dates) {
        blackoutDates.push(new Date(date).getTime());
      }
    }

    this.availabilities = {};
    this.failures = [];
    this.warnings = [];
    await this.populateAvailabilities(formData.fiscalYear);

    const courseSegments: CourseSegment[] = [];
    const assignments: Assignment[] = [];
    const courseRuns: CourseRun[] = [];
    const segmentsByRunByCourse: Map<string, Date[][][]> = new Map();

    rowLoop: for (const row of parsedData) {
      const courseName: string = row.get("course_name").toString();
      const courseConfigWhere: GetCourseConfigDto = {
        course_name: courseName,
        fy: fy.fy,
      };
      const courseConfig: CourseConfig =
        await this.courseService.getCourseConfig(courseConfigWhere);

      const trainers: Prisma.JsonObject =
        courseConfig.trainers as Prisma.JsonObject;
      const daysPerRun: number = courseConfig.days_per_run;
      const segmentsForRow: Date[][] = [];

      if (!segmentsByRunByCourse.has(courseName)) {
        segmentsByRunByCourse.set(courseName, []);
      }

      if (row.has("start_date")) {
        // only one segment is to be created if start date is provided
        const startDate: Date = new Date(row.get("start_date").toString());
        const segmentDates: Date[] = [];
        for (let d = 0; d < daysPerRun; d++) {
          const nextDate: Date = new Date(startDate);
          nextDate.setDate(startDate.getDate() + d);
          segmentDates.push(nextDate);
          if (
            !this.updateTrainerAvailabilities(
              nextDate,
              trainers,
              courseConfig,
              false,
            )
          )
            continue rowLoop;
        }
        segmentsForRow.push(segmentDates);
      } else if (row.has("dates")) {
        // handle multiple segments within provided dates
        const rawDates: Date[] = row
          .get("dates")
          .toString()
          .split(",")
          .map((dateString) => new Date(dateString));
        let segmentDates: Date[] = [];

        for (const date of rawDates) {
          if (segmentDates.length === 0) {
            segmentDates.push(date);
          } else {
            const dayAfterPrevDate: Date = new Date(segmentDates.at(-1));
            dayAfterPrevDate.setDate(dayAfterPrevDate.getDate() + 1);
            if (dayAfterPrevDate.toDateString() === date.toDateString()) {
              segmentDates.push(date);
            } else {
              segmentsForRow.push(segmentDates);
              segmentDates = [date];
            }
          }
          if (
            !this.updateTrainerAvailabilities(
              date,
              trainers,
              courseConfig,
              false,
            )
          )
            continue rowLoop;
        }

        if (segmentDates.length !== 0) {
          segmentsForRow.push(segmentDates);
        }
      }
      segmentsByRunByCourse.get(courseName).push(segmentsForRow);
    }

    for (const [course, runs] of segmentsByRunByCourse) {
      runs.sort((a, b) => {
        return a[0][0].getTime() - b[0][0].getTime();
      });

      const courseConfigWhere: GetCourseConfigDto = {
        course_name: course,
        fy: fy.fy,
      };
      const courseConfig: CourseConfig =
        await this.courseService.getCourseConfig(courseConfigWhere);
      const runsPerYear: number = courseConfig.runs_per_year;
      const daysPerRun: number = courseConfig.days_per_run;
      const prevCourseRuns: CourseRun[] =
        await this.courseService.getCourseRunsOfFyAndCourse(fy.fy, course);
      let runCounter: number = prevCourseRuns.length + 1;

      runLoop: for (const [, run] of runs.entries()) {
        const tempCourseSegments: CourseSegment[] = [];
        const tempAssignments: Assignment[] = [];
        const warningReasons: Set<string> = new Set();
        let dayCount = 0;

        if (runCounter > runsPerYear) {
          warningReasons.add(
            "Number of runs provided do not match the number of runs for this course (Runs / FY config)",
          );
        }

        for (const [s, segment] of run.entries()) {
          tempCourseSegments.push(
            this.helper.constructCourseSegment(
              course,
              courseConfig.fy,
              runCounter,
              s + 1,
              segment,
            ),
          );
          for (const trainer in courseConfig.trainers as Prisma.JsonObject) {
            tempAssignments.push(
              this.helper.constructAssignment(
                course,
                courseConfig.fy,
                runCounter,
                s + 1,
                trainer,
              ),
            );
          }
          // adjust calendar and check blackout dates
          for (const date of segment) {
            const coursesOnDate: CourseSegment[] =
              await this.calendarService.getCoursesOnDate(date);
            const dayCap: number = this.helper.determineDayLimit(
              lowManpowerPeriods,
              date,
              dayLimit,
            );

            if (blackoutDates.includes(date.getTime())) {
              warningReasons.add(
                "Course scheduled on a blackout date: " + date.toDateString(),
              );
            } else if (coursesOnDate.length + 1 > dayCap) {
              warningReasons.add(
                "Max number of courses per day exceeded for " +
                  date.toDateString(),
              );
            }
            dayCount += 1;
          }
        }

        if (dayCount != daysPerRun) {
          warningReasons.add(
            "Number of dates provided does not match the number of days for this course (Days / Run config)",
          );
        }

        const tempRun: CourseRun = this.helper.constructCourseRun(
          course,
          courseConfig.fy,
          runCounter,
        );

        if (warningReasons.size > 0) {
          this.warnings.push({
            reasons: Array.from(warningReasons),
            config: courseConfig,
            itemsOnHold: {
              courseRun: tempRun,
              courseSegments: tempCourseSegments,
              assignments: tempAssignments,
            },
          });
        } else {
          courseRuns.push(tempRun);
          courseSegments.push(...tempCourseSegments);
          assignments.push(...tempAssignments);
        }

        runCounter += 1;
      }
    }

    await this.courseService.createManyCourseRuns(courseRuns);
    await this.courseService.createManyCourseSegments(courseSegments);
    await this.courseService.createManyAssignments(assignments);

    return {
      failures: this.failures,
      warnings: this.warnings,
    };
  }

  private async fixManualAdditionCourses(
    manyCourseConfigs: CourseConfig[],
    manualAdditionRowObjects: Map<string, CellValue>[],
  ) {
    const courseSegments: CourseSegment[] = [];
    const assignments: Assignment[] = [];
    const courseRuns: CourseRun[] = [];
    const segmentsByRunByCourse: Map<string, Date[][][]> = new Map(); // used for run calculation later

    rowLoop: for (const row of manualAdditionRowObjects) {
      const courseName: string = row.get("course_name").toString();
      const courseConfig: CourseConfig = manyCourseConfigs.find(
        (conf) => conf.course_name == courseName,
      );
      const trainers: Prisma.JsonObject =
        courseConfig.trainers as Prisma.JsonObject;
      const daysPerRun: number = courseConfig.days_per_run;
      const segmentsForRow: Date[][] = [];

      if (!segmentsByRunByCourse.has(courseName)) {
        segmentsByRunByCourse.set(courseName, []);
      }

      if (row.has("start_date")) {
        // only one segment is to be created if start date is provided
        const startDate: Date = new Date(row.get("start_date").toString());
        const segmentDates: Date[] = [];
        for (let d = 0; d < daysPerRun; d++) {
          const nextDate: Date = new Date(startDate);
          nextDate.setDate(startDate.getDate() + d);
          segmentDates.push(nextDate);
          if (
            !this.updateTrainerAvailabilities(
              nextDate,
              trainers,
              courseConfig,
              false,
            )
          )
            continue rowLoop;
        }
        segmentsForRow.push(segmentDates);
      } else if (row.has("dates")) {
        // handle multiple segments within provided dates
        const rawDates: Date[] = row
          .get("dates")
          .toString()
          .split(",")
          .map((dateString) => new Date(dateString));
        let segmentDates: Date[] = [];

        for (const date of rawDates) {
          if (segmentDates.length === 0) {
            segmentDates.push(date);
          } else {
            const dayAfterPrevDate: Date = new Date(segmentDates.at(-1));
            dayAfterPrevDate.setDate(dayAfterPrevDate.getDate() + 1);
            if (dayAfterPrevDate.toDateString() === date.toDateString()) {
              segmentDates.push(date);
            } else {
              segmentsForRow.push(segmentDates);
              segmentDates = [date];
            }
          }
          if (
            !this.updateTrainerAvailabilities(
              date,
              trainers,
              courseConfig,
              false,
            )
          )
            continue rowLoop;
        }

        if (segmentDates.length !== 0) {
          segmentsForRow.push(segmentDates);
        }
      }
      segmentsByRunByCourse.get(courseName).push(segmentsForRow);
    }

    // iterate through course segments and create stuff
    segmentsByRunByCourse.forEach((runs: Date[][][], course: string) => {
      runs.sort((a, b) => {
        return a[0][0].getTime() - b[0][0].getTime();
      });

      const courseConfig: CourseConfig = manyCourseConfigs.find(
        (conf) => conf.course_name == course,
      );
      const runsPerYear: number = courseConfig.runs_per_year;
      const daysPerRun: number = courseConfig.days_per_run;

      runLoop: for (const [r, run] of runs.entries()) {
        const tempCourseSegments: CourseSegment[] = [];
        const tempAssignments: Assignment[] = [];
        const warningReasons: Set<string> = new Set();
        let dayCount = 0;

        if (r >= runsPerYear || runs.length != runsPerYear) {
          warningReasons.add(
            "Number of runs provided do not match the number of runs for this course (Runs / FY config)",
          );
        }

        for (const [s, segment] of run.entries()) {
          tempCourseSegments.push(
            this.helper.constructCourseSegment(
              course,
              courseConfig.fy,
              r + 1,
              s + 1,
              segment,
            ),
          );
          for (const trainer in courseConfig.trainers as Prisma.JsonObject) {
            tempAssignments.push(
              this.helper.constructAssignment(
                course,
                courseConfig.fy,
                r + 1,
                s + 1,
                trainer,
              ),
            );
          }
          // adjust calendar and check blackout dates
          for (const date of segment) {
            const adjustResult: string = this.adjustCourseSlotsForDate(
              date,
              -1,
            );
            if (adjustResult === "FAILURE") {
              warningReasons.add(
                "Course scheduled on a blackout date: " + date.toDateString(),
              );
              // continue runLoop
            } else if (adjustResult === "WARNING") {
              warningReasons.add(
                "Max number of courses per day exceeded for " +
                  date.toDateString(),
              );
            }
            dayCount += 1;
          }
        }

        if (dayCount != daysPerRun) {
          warningReasons.add(
            "Number of dates provided does not match the number of days for this course (Days / Run config)",
          );
        }

        const tempRun: CourseRun = this.helper.constructCourseRun(
          course,
          courseConfig.fy,
          r + 1,
        );

        if (warningReasons.size > 0) {
          this.warnings.push({
            reasons: Array.from(warningReasons),
            config: courseConfig,
            itemsOnHold: {
              courseRun: tempRun,
              courseSegments: tempCourseSegments,
              assignments: tempAssignments,
            },
          });
        } else {
          courseRuns.push(tempRun);
          courseSegments.push(...tempCourseSegments);
          assignments.push(...tempAssignments);
        }
      }
    });

    await this.courseService.createManyCourseRuns(courseRuns);
    await this.courseService.createManyCourseSegments(courseSegments);
    await this.courseService.createManyAssignments(assignments);
  }

  private async generateSchedule(courses: Array<CourseConfig>) {
    const courseRuns: CourseRun[] = [];
    const courseSegments: CourseSegment[] = [];
    const assignments: Assignment[] = [];
    const monthlyAvailableSlots: number[] = this.getMonthlyAvailableSlots(); // Populate count of slots left in monthly available slots

    for (const course of courses) {
      const numRuns: number = course.runs_per_year,
        numDays: number = course.days_per_run;
      const avoidMonthStart: boolean = course.avoid_month_start,
        avoidMonthEnd: boolean = course.avoid_month_end;
      const runInterval: number = Math.floor(12 / numRuns);
      const daysToAvoid: number[] = course.days_to_avoid.map((day) =>
        Number(day - 1),
      ); // MAP TO CALENDAR FORMAT (MONDAY IS 0)
      const trainers: Prisma.JsonObject = course.trainers as Prisma.JsonObject;
      const runs: Date[][] = [];
      const startOfRuns: Map<Array<number>, boolean> = new Map(); // check to prevent run overlaps

      if (numRuns <= 12) {
        // Finding the best month to start the first run
        let bestMonthToStart: number;
        const bestMonthBasedOnPrevFy =
          await this.getBestMonthBasedOnLastRunInPrevFy(
            this.yearOne,
            course.course_name,
            runInterval,
          );
        if (bestMonthBasedOnPrevFy === null) {
          // evaluate all possible combinations eg. if 2 runs, jan-jun vs feb-jul vs mar-aug
          bestMonthToStart = this.findBestMonthToStart(
            monthlyAvailableSlots,
            runInterval,
            numRuns,
            avoidMonthStart,
            avoidMonthEnd,
          );
        } else {
          bestMonthToStart = bestMonthBasedOnPrevFy;
        }

        for (let r = 0; r < numRuns; r++) {
          let month = (r * runInterval + bestMonthToStart) % 12;
          let year = month < 3 ? this.yearTwo : this.yearOne;

          const prefWeeks: number[] = this.getPrefWeeks(
            year,
            month,
            avoidMonthStart,
            avoidMonthEnd,
          );
          let dates: Date[] = [];
          // let warningReasons: Set<String> = new Set()
          if (numDays <= 5) {
            // Check if days to avoid config does not fit with num days per run
            if (5 - daysToAvoid.length < numDays) {
              const failure: SchedulingIssue = {
                config: course,
                reasons: [
                  "Too many days to avoid for given days per run (Days To Avoid & Days / Run config)",
                ],
              };
              this.failures.push(failure);
              continue;
            }
            // Find week of the month with the most slots left
            let bestWeek: number = this.findBestWeekOfMonth(
              prefWeeks,
              year,
              month,
            );
            // find the day combination with the most slots left
            let bestDayToStart: number = this.findBestDayToStart(
              numDays,
              daysToAvoid,
              year,
              month,
              bestWeek,
              trainers,
              true,
            );
            if (bestDayToStart === undefined) {
              const { found, yy, mm, ww, dd } = this.seekForward(
                month,
                bestWeek,
                numDays,
                daysToAvoid,
                trainers,
                startOfRuns,
                true,
              );
              if (found) {
                (year = yy),
                  (month = mm),
                  (bestWeek = ww),
                  (bestDayToStart = dd);
              } else {
                // let { found, yy, mm, ww, dd } = this.seekForward(month, bestWeek--, numDays, daysToAvoid, trainers, startOfRuns, false)
                // if (found) {
                //   year = yy, month = mm, bestWeek = ww, bestDayToStart = dd
                // } else {
                // console.log("Failed to find regular" + course.course_name)
                const failure: SchedulingIssue = {
                  config: course,
                  reasons: ["Unable to find fitting schedule"],
                };
                this.failures.push(failure);
                continue;
                // }
              }
            }
            startOfRuns.set([year, month, bestWeek], true);
            dates = this.helper.generateDatesFromWeek(
              year,
              month,
              bestWeek,
              bestDayToStart,
              numDays,
            );
            dates.forEach((date) => {
              this.updateTrainerAvailabilities(date, trainers, course, true);
              this.adjustCourseSlotsForDate(date, -1);
              monthlyAvailableSlots[month] -= 1;
            });
          } else {
            // courses with more than 5 days per run
            let bestWeeks: number[] = this.findBestConsecutiveWeeks(
              prefWeeks,
              year,
              month,
              numDays,
              true,
              trainers,
            );
            if (bestWeeks === undefined) {
              const { found, yy, mm, wws } = this.seekForwardConsecutiveWeeks(
                month,
                prefWeeks,
                numDays,
                startOfRuns,
                true,
                trainers,
              );
              if (found) {
                (bestWeeks = wws), (year = yy), (month = mm);
              } else {
                // let { found, yy, mm, wws } = this.seekForwardConsecutiveWeeks(month, prefWeeks, numDays, startOfRuns, false, trainers)
                // if (found) {
                //   bestWeeks = wws, year = yy, month = mm
                // } else {
                // console.log("Failed to find more than 5 days" + course.course_name)
                const failure: SchedulingIssue = {
                  config: course,
                  reasons: ["Unable to find fitting schedule"],
                };
                this.failures.push(failure);
                continue;
                // }
              }
            }
            startOfRuns.set([year, month, bestWeeks.at(0)], true);
            dates = this.helper.generateDatesFromWeek(
              year,
              month,
              bestWeeks.at(0),
              0,
              numDays,
            );
            dates.forEach((date) => {
              this.updateTrainerAvailabilities(date, trainers, course, true);
              this.adjustCourseSlotsForDate(date, -1);
              monthlyAvailableSlots[month] -= 1;
            });
          }
          runs.push(dates);
        }
      } else {
        // MORE THAN 12 RUNS PER YEAR
        const runsPerMonth: number = Math.ceil(numRuns / 12);
        let runsLeft: number = numRuns;
        for (let month = 0; month <= 11; month++) {
          const numWeeksBetweenRuns: number = Math.floor(
            (4 - runsPerMonth) / runsPerMonth,
          );
          const year: number = month < 3 ? this.yearTwo : this.yearOne;
          const prefWeeks: number[] = this.getPrefWeeks(
            year,
            month,
            avoidMonthStart,
            avoidMonthEnd,
          );
          const bestWeeks: number[] = this.findBestNonConsecutiveWeeks(
            prefWeeks,
            year,
            month,
            runsPerMonth,
            numWeeksBetweenRuns,
          );
          for (const week of bestWeeks) {
            if (startOfRuns.has([year, month, week]) || runsLeft == 0) {
              continue; // skip the scheduling of this week since there is a clash with another run
            }
            const bestDayToStart: number = this.findBestDayToStart(
              numDays,
              daysToAvoid,
              year,
              month,
              week,
              trainers,
              true,
            );
            // if unable to find ideal slot within week, skip for now (will seek forward for all remaining runs left later)
            if (bestDayToStart === undefined) {
              continue;
            }
            startOfRuns.set([year, month, week], true);
            const dates: Date[] = this.helper.generateDatesFromWeek(
              year,
              month,
              week,
              bestDayToStart,
              numDays,
            );
            // minus one availability for each day where course segment is scheduled and update monthly course count
            dates.forEach((date) => {
              this.updateTrainerAvailabilities(date, trainers, course, true);
              this.adjustCourseSlotsForDate(date, -1);
              monthlyAvailableSlots[month] -= 1;
            });
            runs.push(dates);
            runsLeft--;
          }
        }
        // Try to find spots for remaining runs that failed the first round of scheduling
        for (let r = 0; r < runsLeft; r++) {
          const monthInterval: number = Math.abs(
            Math.floor((12 - runsLeft) / runsLeft),
          );
          const month: number = Math.abs((r * (monthInterval + 1)) % 12);
          const { found, yy, mm, ww, dd } = this.seekForward(
            month,
            0,
            numDays,
            daysToAvoid,
            trainers,
            startOfRuns,
            true,
          );
          let dates: Date[];
          if (found) {
            startOfRuns.set([yy, mm, ww], true);
            dates = this.helper.generateDatesFromWeek(yy, mm, ww, dd, numDays);
          } else {
            // let { found, yy, mm, ww, dd } = this.seekForward(month, -1, numDays, daysToAvoid, trainers, startOfRuns, false)
            // if (found) {
            //   startOfRuns.set([yy, mm, ww], true)
            //   dates = this.helper.generateDatesFromWeek(yy, mm, ww, dd, numDays)
            // } else {
            // console.log("Failed to find more than 12 runs" + course.course_name)
            const failure: SchedulingIssue = {
              config: course,
              reasons: ["Unable to find fitting schedule"],
            };
            this.failures.push(failure);
            continue;
            // }
          }
          // minus one availability for each day where course segment is scheduled and update monthly course count
          dates.forEach((date) => {
            this.updateTrainerAvailabilities(date, trainers, course, true);
            this.adjustCourseSlotsForDate(date, -1);
            monthlyAvailableSlots[month] -= 1;
          });
          runs.push(dates);
        }
      }
      // sort runs by chronological order before labelling run 1 run 2 run 3 etc.
      runs.sort((a, b) => {
        return a[0].getTime() - b[0].getTime();
      });
      runs.forEach((runDates, r) => {
        courseRuns.push(
          this.helper.constructCourseRun(course.course_name, course.fy, r + 1),
        );
        courseSegments.push(
          this.helper.constructCourseSegment(
            course.course_name,
            course.fy,
            r + 1,
            1,
            runDates,
          ),
        );
        // create assignment for each trainer => course segment
        for (const trainer in trainers) {
          assignments.push(
            this.helper.constructAssignment(
              course.course_name,
              course.fy,
              r + 1,
              1,
              trainer,
            ),
          );
        }
      });
    }
    // console.log("*********GENERATED RUNS*************")
    // console.log(courseRuns);
    // console.log("*********GENERATED SEGMENTS*************")
    // console.log(courseSegments);
    // console.log("*********GENERATED ASSIGNMENTS*************")
    // console.log(assignments);

    await this.courseService.createManyCourseRuns(courseRuns);
    await this.courseService.createManyCourseSegments(courseSegments);
    await this.courseService.createManyAssignments(assignments);
  }

  async confirmItemsOnHold(dto: AddItemsOnHoldDto) {
    const errors = [];
    for (const heldItems of dto.approvedRuns) {
      const { courseRun, courseSegments, assignments } = heldItems;
      try {
        const run = await this.prisma.courseRun.findUnique({
          where: {
            run_course_name_fy: {
              run: courseRun.run,
              fy: courseRun.fy,
              course_name: courseRun.course_name,
            },
          },
        });
        if (run == null) {
          await this.courseService.createCourseRun(courseRun);
        }
        await this.courseService.createManyCourseSegments(courseSegments);
        await this.courseService.createManyAssignments(assignments);
      } catch (e) {
        errors.push({
          message: e.message,
          name: e.name,
          items: heldItems,
        });
      }
    }
    return { errors: errors };
  }

  private getMonthlyAvailableSlots(): number[] {
    const monthlyAvailableSlots: number[] = Array(12);
    for (let m = 0; m <= 2; m++) {
      let slotsLeft = 0;
      for (const w in this.calendar[this.yearTwo][m]["weeks"]) {
        const weekArr: number[] = this.calendar[this.yearTwo][m]["weeks"][w];
        slotsLeft += this.helper.sumArray(weekArr);
      }
      monthlyAvailableSlots[m] = slotsLeft;
    }
    for (let m = 3; m <= 11; m++) {
      let slotsLeft = 0;
      for (const w in this.calendar[this.yearOne][m]["weeks"]) {
        const weekArr: number[] = this.calendar[this.yearOne][m]["weeks"][w];
        slotsLeft += this.helper.sumArray(weekArr);
      }
      monthlyAvailableSlots[m] = slotsLeft;
    }

    // normalizing so the most available month won't get spammed
    const ratio = Math.max(...monthlyAvailableSlots) / 36;

    for (let i = 0; i < monthlyAvailableSlots.length; i++) {
      monthlyAvailableSlots[i] = Math.round(monthlyAvailableSlots[i] / ratio);
    }

    return monthlyAvailableSlots;
  }

  async createErrorWorkbook(
    file: Express.Multer.File,
    courseInfoValidationObjects: Map<number, string>,
    manualValidationObjects: Map<number, string>,
  ): Promise<Workbook> {
    const workbook = new Workbook();
    const res = workbook.xlsx.load(file.buffer).then(async () => {
      const courseInfoSheet = workbook.getWorksheet("Course Information");
      const courseInfoErrorCell = courseInfoSheet.getRow(1).getCell(16);
      courseInfoErrorCell.value = "Error(s)";
      for (const [key, value] of courseInfoValidationObjects.entries()) {
        const row = courseInfoSheet.getRow(key);
        row.getCell(16).value = value;
      }

      const manualSheet = workbook.getWorksheet("Manual Addition");
      const manualErrorCell = manualSheet.getRow(1).getCell(6);
      manualErrorCell.value = "Error(s)";
      for (const [key, value] of manualValidationObjects.entries()) {
        const row = manualSheet.getRow(key);
        row.getCell(6).value = value;
      }
      return workbook;
    });
    return res;
  }

  async getPublicHolidays(dto: HolidayDto) {
    const timeMin = dto.startYear + "-04-01T00:00:00Z"; // min year
    const timeMax = parseInt(dto.startYear) + 1 + "-03-31T00:00:00Z"; // max year
    const key = this.configService.get("GOOGLE_CALENDAR_KEY");
    const url =
      "https://www.googleapis.com/calendar/v3/calendars/en.singapore%23holiday%40group.v.calendar.google.com/events?timeMax=" +
      timeMax +
      "&key=" +
      key +
      "&timeMin=" +
      timeMin;
    const { data } = await firstValueFrom(this.httpService.get(url));

    const map = new Map<string, string>();
    const nonHolidays = [
      "Easter Sunday",
      "Easter Saturday",
      "Children's Day",
      "Teachers' Day",
    ];

    for (let i = 0; i < data.items.length; i++) {
      const holiday = data.items[i];
      const name = holiday.summary;
      const date = holiday.start.date;

      const dateFormat = new Date(date);
      const day = dateFormat.getDay();

      // Check if Sunday
      if (day == 0) {
        dateFormat.setDate(dateFormat.getDate() + 1);
      }

      if (!nonHolidays.includes(name)) {
        map.set(name, dateFormat.toISOString());
      }
    }

    return Object.fromEntries(map);
  }

  async getTrainerFilterOptions(dto: trainerFilterDto) {
    try {
      const options_dict = {};

      // trainer programmes and courses
      const trainer_courses = await this.prisma.courseConfig.findMany({
        where: {
          fy: dto.fy,
          CourseRun: {
            some: {
              CourseSegment: {
                some: {
                  Assignment: {
                    some: {
                      user_name: dto.trainerName,
                    },
                  },
                },
              },
            },
          },
        },
        select: {
          Course: true,
        },
      });

      const programme_names = trainer_courses.map(
        (course) => course["Course"]["programme_name"],
      );
      const unique_programme_names = [...new Set(programme_names)];
      const course_names = trainer_courses.map(
        (programme) => programme["Course"]["course_name"],
      );

      options_dict["programmes"] = unique_programme_names;
      options_dict["courses"] = course_names;

      // // all status
      let trainer_status = Object.values(Status);
      trainer_status = trainer_status.filter(
        (element) => element != "GENERATED" && element != "REVIEWED",
      );
      options_dict["status"] = trainer_status;

      // // all mode of delivery
      const all_mod = Object.values(DeliveryMode);
      options_dict["mode of delivery"] = all_mod;

      return options_dict;
    } catch (e) {
      return e;
    }
  }

  async getPMFilterOptions(dto: fyDto) {
    try {
      const options_dict = {};

      // all programmes
      const all_programmes = await this.prisma.courseConfig.findMany({
        where: {
          fy: dto.fy,
        },
        select: {
          Course: true,
        },
      });
      const programme_names = all_programmes.map(
        (programme) => programme["Course"]["programme_name"],
      );
      options_dict["programmes"] = programme_names;

      // all courses
      const all_courses = await this.prisma.courseConfig.findMany({
        where: {
          fy: dto.fy,
        },
      });

      const course_names = all_courses.map((course) => course["course_name"]);
      options_dict["courses"] = course_names;

      // all trainers
      const all_assignments = await this.prisma.courseConfig.findMany({
        where: {
          fy: dto.fy,
        },
        select: {
          CourseRun: {
            select: {
              CourseSegment: {
                select: {
                  Assignment: true,
                },
              },
            },
          },
        },
      });

      const nameSet = new Set();

      for (let i = 0; i < all_assignments.length; i++) {
        const courseRun = all_assignments[i]["CourseRun"];
        for (let j = 0; j < courseRun.length; j++) {
          const courseSegment = courseRun[j]["CourseSegment"];
          for (let k = 0; k < courseSegment.length; k++) {
            const assignment = courseSegment[k]["Assignment"];
            for (let l = 0; l < assignment.length; l++) {
              const username = assignment[l]["user_name"];
              nameSet.add(username);
            }
          }
        }
      }
      const trainer_names = Array.from(nameSet);
      options_dict["trainers"] = trainer_names;

      // // all status
      const all_status = Object.values(Status);
      options_dict["status"] = all_status;

      // // all mode of delivery
      const all_mod = Object.values(DeliveryMode);
      options_dict["mode of delivery"] = all_mod;

      return options_dict;
    } catch (e) {
      return e;
    }
  }

  async getFilterResults(dto: FilterDto) {
    // filter by programme - Course model
    // filter by course_name - Course model
    // filter by delivery_mode - Course model
    // filter by status - Course Segment model
    // filter by trainer - Assignment model

    const programme_name: Array<string> = dto.programme_name;
    const course_name: Array<string> = dto.course_name;
    const delivery_mode: Array<DeliveryMode> = dto.delivery_mode;
    const status: Array<Status> = dto.status;
    const trainers: Array<string> = dto.trainers;

    const courseQuery = {};

    if (programme_name.length !== 0) {
      courseQuery["programme_name"] = { in: programme_name };
    }

    if (course_name.length !== 0) {
      courseQuery["course_name"] = { in: course_name };
    }

    if (delivery_mode.length !== 0) {
      courseQuery["delivery_mode"] = { in: delivery_mode };
    }

    const courseSegmentQuery = {
      fy: dto.fy,
    };

    if (status.length !== 0) {
      courseSegmentQuery["status"] = { in: status };
    }

    const response = await this.prisma.course.findMany({
      where: courseQuery,
      select: {
        course_code: true,
        programme_name: true,
        delivery_mode: true,
        CourseConfig: {
          select: {
            start_time: true,
            end_time: true,
            CourseRun: {
              select: {
                CourseSegment: {
                  where: courseSegmentQuery,
                  select: {
                    course_name: true,
                    dates: true,
                    status: true,
                    Assignment: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const courseRuns = [];

    for (let c = 0; c < response.length; c++) {
      // courseConfig
      const courseConfig = response[c].CourseConfig;

      for (let r = 0; r < courseConfig.length; r++) {
        // courseRun
        const courseRun = response[c].CourseConfig[r].CourseRun;

        for (let s = 0; s < courseRun.length; s++) {
          // courseSegment
          const courseSegment =
            response[c].CourseConfig[r].CourseRun[s].CourseSegment;
          for (let a = 0; a < courseSegment.length; a++) {
            // assignment
            const assignment = courseSegment[a].Assignment;
            if (assignment.length == 0) {
              continue;
            }
            const trainerAssignmentStatuses: Map<string, Status> = new Map();
            const trainerDeclineReason: Map<string, string> = new Map();
            let trainerExists: boolean = trainers.length == 0 ? true : false;
            for (let i = 0; i < assignment.length; i++) {
              if (trainers.includes(assignment[i].user_name)) {
                trainerExists = true;
              }
              trainerAssignmentStatuses.set(
                assignment[i].user_name,
                assignment[i].assignment_status,
              );
              if (assignment[i].assignment_status == Status.DECLINED) {
                trainerDeclineReason.set(
                  assignment[i].user_name,
                  assignment[i].decline_reason,
                );
              }
            }
            if (!trainerExists) {
              continue;
            }
            const output: formatted_date = {
              programme_name: response[c].programme_name,
              course_code: response[c].course_code,
              delivery_mode: response[c].delivery_mode,
              start_time: new Date(response[c].CourseConfig[r].start_time)
                .toISOString()
                .slice(11, 16),
              end_time: new Date(response[c].CourseConfig[r].end_time)
                .toISOString()
                .slice(11, 16),
              run: assignment[0].run,
              segment: assignment[0].segment,
              course_name: courseSegment[a].course_name,
              fy: assignment[0].fy,
              trainersAssignmentResponse: Object.fromEntries(
                trainerAssignmentStatuses,
              ),
              trainerDeclineReason: Object.fromEntries(trainerDeclineReason),
              status: courseSegment[a].status,
              dates: courseSegment[a].dates,
            };
            courseRuns.push(output);
          }
        }
      }
    }
    return courseRuns;
  }

  async getBlackoutDates(body: fyDto) {
    const fyInfo: FiscalYear = await this.fiscalYearService.getFiscalYear({
      where: { fy: body.fy },
    });

    const blackoutDates: Map<string, Array<string>> = JSON.parse(
      JSON.stringify(fyInfo.blackout_dates),
    );
    return this.formatBlackoutDates(blackoutDates);
  }

  // ======================================= HELPER FUNCTIONS ==========================================
  formatCalendarResults(courseRuns: Array<any>) {
    const events = [];

    for (let i = 0; i < courseRuns.length; i++) {
      const currentObj = courseRuns[i];

      const originalStartDate = currentObj.dates[0];
      const originalEndDate = currentObj.dates.at(-1);

      const start = originalStartDate.toISOString().split("T")[0];
      const end = originalEndDate.toISOString().split("T")[0];
      const objStartTime = currentObj.start_time;
      const objEndTime = currentObj.end_time;
      const timed: boolean = objStartTime != "00:00" || objEndTime != "00:00";
      const startTime: boolean | string = timed ? false : objStartTime;
      const endTime: boolean | string = timed ? false : objEndTime;

      events.push({
        programme_name: currentObj.programme_name,
        course_code: currentObj.course_code,
        delivery_mode: currentObj.delivery_mode,
        name: currentObj.course_name,
        start: start,
        end: end,
        timed: false,
        status: currentObj.status,
        additionalEventInfo: {
          user_name: currentObj.user_name,
          segment: currentObj.segment,
          fy: currentObj.fy,
          run: currentObj.run,
          start_time: startTime,
          end_time: endTime,
          blackout_date: false,
          trainersAssignmentResponse: currentObj.trainersAssignmentResponse,
          trainerDeclineReason: currentObj.trainerDeclineReason,
        },
      });
    }
    return events;
  }

  private formatBlackoutDates(blackoutDates: Map<string, Array<string>>) {
    const events = [];
    for (const [name, dates] of Object.entries(blackoutDates)) {
      dates.sort(function (a: string, b: string) {
        return new Date(a).getTime() - new Date(b).getTime();
      });
      const startDate: string = new Date(dates[0]).toISOString().split("T")[0];
      const endDate: string = new Date(dates.at(-1))
        .toISOString()
        .split("T")[0];
      events.push({
        name: name,
        start: startDate,
        end: endDate,
        timed: false,
        color: "black",
        additionalEventInfo: {
          blackout_date: true,
        },
      });
    }
    return events;
  }

  private initCalendar(
    maxCourseRunsPerDay: number,
    blackoutDates: BlackoutDates,
    lowManpowerDates: LowManpowerDates,
  ) {
    const calendar: Calendar = {};
    let firstYear: Year = {};
    let secondYear: Year = {};
    firstYear = this.helper.initYear(this.yearOne, maxCourseRunsPerDay, 3, 11);
    secondYear = this.helper.initYear(this.yearTwo, maxCourseRunsPerDay, 0, 2);
    calendar[this.yearOne] = firstYear;
    calendar[this.yearTwo] = secondYear;
    this.calendar = calendar;

    this.setLowManpowerDates(lowManpowerDates);

    this.setBlackoutDates(blackoutDates);

    return calendar;
  }

  private setBlackoutDates(blackoutDates: BlackoutDates) {
    for (const period_name in blackoutDates) {
      const dates: Date[] = blackoutDates[period_name];
      for (const date of dates) {
        this.setCourseSlotsForDate(date, null);
      }
    }
  }

  private adjustCourseSlotsForDate(date: Date, increment: number): string {
    const yy = date.getFullYear();
    const mm = date.getMonth();
    const dayOfWeek = date.getDay();
    if (yy in this.calendar && dayOfWeek != 0 && dayOfWeek != 6) {
      const week: number = this.helper.getWeekFromDate(date);
      if (this.calendar[yy][mm]["weeks"][week][dayOfWeek - 1] === null) {
        return "FAILURE";
      }
      if (this.calendar[yy][mm]["weeks"][week][dayOfWeek - 1] <= 0) {
        this.calendar[yy][mm]["weeks"][week][dayOfWeek - 1] -= 100;
        return "WARNING";
      }
      this.calendar[yy][mm]["weeks"][week][dayOfWeek - 1] += increment;
    }
    return "";
  }

  private setLowManpowerDates(lowManpowerDates: LowManpowerDates) {
    for (const period_name in lowManpowerDates) {
      const period: LowManpowerDate = lowManpowerDates[period_name];
      const dayLimit: number = period.day_limit;
      const dates: Date[] = period.dates;
      for (const date of dates) {
        this.setCourseSlotsForDate(date, dayLimit);
      }
    }
  }

  private setCourseSlotsForDate(date: Date, slots: null | number) {
    const yy = date.getFullYear();
    const mm = date.getMonth();
    const dayOfWeek = date.getDay();
    if (yy in this.calendar && dayOfWeek != 0 && dayOfWeek != 6) {
      const week: number = this.helper.getWeekFromDate(date);
      this.calendar[yy][mm]["weeks"][week][dayOfWeek - 1] = slots;
    }
  }

  private findBestMonthToStart(
    monthlyAvailableSlots: number[],
    runInterval: number,
    numRuns: number,
    avoidMonthStart: boolean,
    avoidMonthEnd: boolean,
  ): number {
    let maxCourseSlotsLeftForMonth: number = Number.MIN_SAFE_INTEGER;
    let bestMonthToStart: number;

    for (let i = 0; i < runInterval; i++) {
      let courseSlotsLeftForMonths = 0;

      // calculating courseSlotsLeftForMonths for candidate months
      for (let j = 0; j < numRuns; j++) {
        const month: number = i + j * runInterval;
        const year = month < 3 ? this.yearTwo : this.yearOne;
        courseSlotsLeftForMonths += Number(monthlyAvailableSlots[month]);

        const lastWeek: number =
          Object.keys(this.calendar[year][month]["weeks"]).length - 1;

        // readjust if we have to avoid first / last weeks
        const allowedWeeks: number[] = this.getPrefWeeks(
          year,
          month,
          avoidMonthStart,
          avoidMonthEnd,
        );
        for (let sw = 0; sw < allowedWeeks.at(0); sw++) {
          courseSlotsLeftForMonths -= Number(
            this.helper.sumArray(this.calendar[year][month]["weeks"][sw]),
          );
        }
        for (let ew = lastWeek; ew > allowedWeeks.at(-1); ew--) {
          courseSlotsLeftForMonths -= Number(
            this.helper.sumArray(this.calendar[year][month]["weeks"][ew]),
          );
        }
      }

      // compare course count of candidate months vs current min count
      if (courseSlotsLeftForMonths > maxCourseSlotsLeftForMonth) {
        maxCourseSlotsLeftForMonth = courseSlotsLeftForMonths;
        bestMonthToStart = i;
      }
    }
    return bestMonthToStart;
  }

  // returns start and end week
  private getPrefWeeks(
    year: number,
    month: number,
    avoidStart: boolean,
    avoidEnd: boolean,
  ): number[] {
    let startWeek: number;
    let endWeek: number;
    const lastWeek: number =
      Object.keys(this.calendar[year][month]["weeks"]).length - 1;

    if (avoidStart) {
      const monthStartDay: number = new Date(year, month, 1).getDay();
      startWeek = monthStartDay > 2 ? 2 : 1;
    } else {
      startWeek = 0;
    }

    if (avoidEnd) {
      const monthEndDay: number = new Date(year, month + 1, 0).getDay();
      endWeek = monthEndDay < 4 ? lastWeek - 2 : lastWeek - 1;
    } else {
      endWeek = lastWeek;
    }
    return Array.from(
      { length: endWeek - startWeek + 1 },
      (_, idx) => idx + startWeek,
    );
  }

  private findBestWeekOfMonth(
    prefWeeks: number[],
    year: number,
    month: number,
  ): number {
    let maxSlotsLeftForWeek: number = Number.MIN_SAFE_INTEGER;
    let bestWeek: number;
    // loop through preferred weeks
    for (let w = 0; w < prefWeeks.length; w++) {
      const slotsLeftForWeek = this.helper.sumArray(
        this.calendar[year][month]["weeks"][prefWeeks[w]],
      );
      if (slotsLeftForWeek > maxSlotsLeftForWeek) {
        maxSlotsLeftForWeek = slotsLeftForWeek;
        bestWeek = prefWeeks[w];
      }
    }
    // if (month == 9 && bestWeek == 2) {
    //   console.log(`WEEK: ${prefWeeks[sw]} , SLOTS: ${slotsLeftForWeeks}, CURRENT: ${maxSlotsLeftForWeeks}, BW: ${bestWeeks}`)
    // }
    return bestWeek;
  }

  private findBestNonConsecutiveWeeks(
    prefWeeks: number[],
    year: number,
    month: number,
    runsPerMonth: number,
    numWeeksBetweenRuns: number,
  ): number[] {
    let maxSlotsLeftForWeeks: number = Number.MIN_SAFE_INTEGER;
    let bestWeeks: number[];
    // loop through preferred weeks
    for (let w = 0; w < prefWeeks.length; w++) {
      const weeks: number[] = [];
      let slotsLeftForWeeks = 0;
      for (let r = 0; r < runsPerMonth; r++) {
        const week: number = w + r * (numWeeksBetweenRuns + 1);
        if (week <= prefWeeks.at(-1)) {
          weeks.push(week);
          const slotsLeftForWeek = this.helper.sumArray(
            this.calendar[year][month]["weeks"][prefWeeks[week]],
          );
          slotsLeftForWeeks += slotsLeftForWeek;
        }
      }
      if (slotsLeftForWeeks > maxSlotsLeftForWeeks) {
        maxSlotsLeftForWeeks = slotsLeftForWeeks;
        bestWeeks = weeks;
      }
    }
    return bestWeeks;
  }

  private findBestConsecutiveWeeks(
    prefWeeks: number[],
    year: number,
    month: number,
    numDays: number,
    useStrict: boolean,
    trainers,
  ): number[] {
    const numWeeks: number = Math.ceil((numDays - 6) / 7) + 1; // minus six and add one week for first week cos start on monday
    let maxSlotsLeftForWeeks: number = Number.MIN_SAFE_INTEGER;
    let bestWeeks: number[];
    // loop through preferred weeks
    for (let sw = 0; sw < prefWeeks.length - numWeeks; sw++) {
      const weeks: number[] = Array.from(
        { length: numWeeks },
        (_, idx) => idx + prefWeeks[sw],
      );
      let slotsLeftForWeeks = 0;
      let isAvailable = true;
      for (const week of weeks) {
        const currWeek: number[] = this.calendar[year][month]["weeks"][week];
        for (const day of currWeek) {
          if (
            (useStrict && (day === null || day <= 0)) ||
            (!useStrict && day === null) ||
            !this.areTrainersAvailable(
              this.helper.generateDateFromWeek(year, month, week, day),
              trainers,
            )
          ) {
            isAvailable = false;
            break;
          }
        }
        const slotsLeftForWeek = this.helper.sumArray(currWeek);
        slotsLeftForWeeks += slotsLeftForWeek;
      }
      if (slotsLeftForWeeks > maxSlotsLeftForWeeks && isAvailable) {
        maxSlotsLeftForWeeks = slotsLeftForWeeks;
        bestWeeks = weeks;
      }
    }
    return bestWeeks;
  }

  private findBestDayToStart(
    numDays: number,
    daysToAvoid: number[],
    year: number,
    month: number,
    week: number,
    trainers: Prisma.JsonObject,
    useStrict: boolean,
  ): number {
    let maxSlotsLeftForDays: number = Number.MIN_SAFE_INTEGER;
    let bestDayToStart: number;
    const numOptions: number = 5 - numDays + 1;

    candidateLoop: for (let d = 0; d < numOptions; d++) {
      let slotsLeftForDays = 0;
      for (let f = d; f < d + numDays; f++) {
        // loop through number of days in selected days
        const date: Date = this.helper.generateDateFromWeek(
          year,
          month,
          week,
          f,
        );
        const selectedDay: number | null =
          this.calendar[year][month]["weeks"][week][f];
        if (
          daysToAvoid.includes(f) ||
          !this.areTrainersAvailable(date, trainers) ||
          (useStrict && (selectedDay === null || selectedDay <= 0)) ||
          (!useStrict && selectedDay === null)
        ) {
          continue candidateLoop;
        } else {
          slotsLeftForDays += this.calendar[year][month]["weeks"][week][f];
        }
      }
      if (slotsLeftForDays > maxSlotsLeftForDays) {
        maxSlotsLeftForDays = slotsLeftForDays;
        bestDayToStart = d;
      }
    }
    return bestDayToStart; // returns undefined if unable to find a suitable day within the week
  }

  private seekForwardConsecutiveWeeks(
    month: number,
    prefWeeks: number[],
    numDays: number,
    startOfRuns: Map<Array<number>, boolean>,
    useStrict: boolean,
    trainers,
  ): {
    found: boolean;
    yy: number;
    mm: number;
    wws: number[];
  } {
    const startMonth = month;
    let year: number;
    let bestWeeks: number[];
    do {
      month = (month + 1) % 12;
      year = month < 3 ? this.yearTwo : this.yearOne;
      const weeks: number[] = this.findBestConsecutiveWeeks(
        prefWeeks,
        year,
        month,
        numDays,
        useStrict,
        trainers,
      );
      if (weeks !== undefined && !startOfRuns.has([year, month, weeks.at(0)])) {
        break;
      }
    } while (!(month === startMonth));

    return {
      found: bestWeeks === undefined ? false : true,
      yy: year,
      mm: month,
      wws: bestWeeks,
    };
  }

  private seekForward(
    month: number,
    week: number,
    numDays: number,
    daysToAvoid: number[],
    trainers: Prisma.JsonObject,
    startOfRuns: Map<Array<number>, boolean>,
    useStrict: boolean,
  ): {
    found: boolean;
    yy: number;
    mm: number;
    ww: number;
    dd: number;
  } {
    const startMonth = month,
      startWeek = week;
    let bestDayToStart: number;
    let year: number;
    do {
      week++;
      year = month < 3 ? this.yearTwo : this.yearOne;
      const lastWeekOfMonth: number =
        Object.keys(this.calendar[year][month]["weeks"]).length - 1;
      if (week > lastWeekOfMonth) {
        month = (month + 1) % 12;
        week = 0;
        continue;
      }
      // check if there is already a run planned for that year-month-week
      if (startOfRuns.has([year, month, week])) {
        continue;
      }
      bestDayToStart = this.findBestDayToStart(
        numDays,
        daysToAvoid,
        year,
        month,
        week,
        trainers,
        useStrict,
      );
      if (bestDayToStart !== undefined) {
        break;
      }
    } while (!(month === startMonth && week === startWeek));

    return {
      found: bestDayToStart === undefined ? false : true,
      yy: year,
      mm: month,
      ww: week,
      dd: bestDayToStart,
    };
  }

  private areTrainersAvailable(
    date: Date,
    trainers: Prisma.JsonObject,
  ): boolean {
    for (const trainer in trainers) {
      if (
        trainer in this.availabilities &&
        this.availabilities[trainer].includes(date.getTime())
      ) {
        return false;
      }
    }
    return true;
  }

  private updateTrainerAvailabilities(
    date: Date,
    trainers: Prisma.JsonObject,
    config: CourseConfig,
    skipCheck: boolean,
  ): boolean {
    if (skipCheck || this.areTrainersAvailable(date, trainers)) {
      for (const trainer in trainers) {
        if (trainer in this.availabilities) {
          this.availabilities[trainer].push(date.getTime());
        } else {
          this.availabilities[trainer] = [date.getTime()];
        }
      }
      return true;
    } else {
      this.failures.push({
        config: config,
        reasons: ["Trainer Availability Conflict on " + date.toDateString()],
      });
      return false;
    }
  }

  private async populateAvailabilities(fy: string) {
    const res =
      await this.trainerService.getAssignmentsTrainersSegmentDatesOfFy(fy);
    // { user_name: 'Tan Hwee Pink', CourseSegment: { dates: [Array] } },
    for (const assignment of res) {
      if (!(assignment.user_name in this.availabilities)) {
        this.availabilities[assignment.user_name] = [];
      }
      for (const date of assignment.CourseSegment.dates) {
        this.availabilities[assignment.user_name].push(
          new Date(date).getTime(),
        );
      }
    }
  }

  private async getBestMonthBasedOnLastRunInPrevFy(
    currentYearOne: number,
    courseName: string,
    runInterval: number,
  ): Promise<number | null> {
    const prevFy: string = Number(currentYearOne) - 1 + "-" + currentYearOne;
    const prevFyLastDate: Date = new Date(currentYearOne, 2, 31); // 31st Mar
    const courseSegments: CourseSegment[] =
      await this.courseService.getCourseSegmentsOfFyAndCourse(
        prevFy,
        courseName,
      );

    if (courseSegments.length === 0) {
      return null;
    } else {
      courseSegments.sort(function (segment1, segment2) {
        return segment2.dates[0].getTime() - segment1.dates[0].getTime();
      });
      const latestDate: Date = courseSegments[0].dates[0];

      const nextFyFirstRunDate: Date = new Date(latestDate);

      nextFyFirstRunDate.setMonth(latestDate.getMonth() + runInterval);
      if (nextFyFirstRunDate.getDate() != latestDate.getDate()) {
        // handle overflow for months with different number of days
        nextFyFirstRunDate.setDate(0);
      }

      return nextFyFirstRunDate < prevFyLastDate
        ? 3
        : nextFyFirstRunDate.getMonth();
    }
  }
}
