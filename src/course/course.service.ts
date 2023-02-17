import { Injectable } from "@nestjs/common";
import {
  Assignment,
  Course,
  CourseConfig,
  CourseRun,
  CourseSegment,
  DeliveryMode,
  Prisma,
  Programme,
  Status,
} from "@prisma/client";
import { Workbook } from "exceljs";
import { FiscalYearService } from "src/fiscal-year/fiscal-year.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { FilterDto, fyDto } from "src/scheduler/dto";
import { TrainerService } from "src/trainer/trainer.service";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CourseRunDto,
  UpdateCourseSegmentDto,
  GetCourseConfigDto,
  GetProgrammeDto,
  CourseDto,
  CreateNewCourseDto,
  ProgrammeDto,
  EditCourseSegmentDto,
  CourseFilterDto,
} from "./dto";
import { AssignmentDto } from "./dto/get-assignment.dto";

interface formatted_date {
  programme_name: string;
  course_code: string;
  delivery_mode: DeliveryMode;
  end_time: string;
  start_time: string;
  days_per_run: number;
  runs_per_year: number;
  course_fees: string;
  days_to_avoid: string;
  avoid_month_start: boolean;
  avoid_month_end: boolean;
  trainers: string;
  user_name: string;
  segment: number;
  course_name: string;
  fy: string;
  run: number;
  status: Status;
  dates: Array<Date>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CourseService {
  constructor(
    private prisma: PrismaService,
    private fiscalYearService: FiscalYearService,
    private trainerService: TrainerService,
    private notificationsService: NotificationsService,
  ) {}

  async getCourses(fy: fyDto) {
    const response = await this.prisma.courseConfig.findMany({
      where: {
        fy: fy.fy,
      },
      select: {
        days_per_run: true,
        trainers: true,
        course_fees: true,
        Course: true, // Course
      },
    });

    const output = [];

    for (let i = 0; i < response.length; i++) {
      const course = response[i].Course; // course entity
      const course_fees = response[i].course_fees.toLocaleString("en-SG");
      const days = response[i].days_per_run;
      const trainers = response[i].trainers as Prisma.JsonObject;

      const trainerArr = [];

      // trainerName : array_of_runs_taught
      for (const trainer in trainers) {
        trainerArr.push(trainer);
      }

      output.push({
        ...course,
        course_fees,
        days,
        trainers: trainerArr,
      });
    }
    return output;
  }

  async getCourseDetails(courseConfigDto: GetCourseConfigDto) {
    const response = await this.prisma.courseConfig.findFirst({
      where: {
        course_name: courseConfigDto.course_name,
        fy: courseConfigDto.fy,
      },
      include: {
        Course: true, // Course
      },
    });

    const dta = response.days_to_avoid;
    const converted_days = [];

    if (dta.length != 0) {
      for (let i = 0; i < dta.length; i++) {
        converted_days.push(this.dayOfWeekAsString(dta[i])); // helper function
      }
    }

    response.days_to_avoid = converted_days;

    // get number of scheduled runs
    const scheduledRuns = await this.prisma.courseRun.count({
      where: {
        course_name: courseConfigDto.course_name,
        fy: courseConfigDto.fy,
      },
    });

    response["runs_scheduled"] = scheduledRuns;

    return response;
  }

  async removeCourse(courseConfig: GetCourseConfigDto) {
    try {
      return this.prisma.courseConfig.delete({
        where: {
          course_name_fy: {
            course_name: courseConfig.course_name,
            fy: courseConfig.fy,
          },
        },
      });
    } catch (e) {
      return e;
    }
  }

  async editScheduledCourseRun(editCourseSegmentDto: EditCourseSegmentDto) {
    try {
      const bypass = editCourseSegmentDto.bypass;
      const newTrainerList = editCourseSegmentDto.newTrainerList;
      const dates = editCourseSegmentDto.dates;
      const courseName = editCourseSegmentDto.course_name;
      const fy = editCourseSegmentDto.fy;
      const segment = editCourseSegmentDto.segment;
      const run = editCourseSegmentDto.run;
      const status = editCourseSegmentDto.status;
      const originalSegment = await this.prisma.courseSegment.findUnique({
        where: {
          segment_course_name_fy_run: {
            fy: fy,
            course_name: courseName,
            segment: segment,
            run: run,
          },
        },
      });
      const originalSegmentDates: Date[] = originalSegment.dates;
      const allDates: string[] = this.getAllDatesBetween(dates);

      if (!bypass) {
        const fyInfo = await this.fiscalYearService.getFiscalYear({
          where: { fy: fy },
        });

        const allCourseSegmentsInFy: Array<CourseSegment> =
          await this.getCourseSegmentsOfFy(editCourseSegmentDto.fy);

        // get all course segments on same days excluding itself
        const courseSegmentsOnSameDays: Map<
          string,
          Array<CourseSegment>
        > = this.getCourseSegmentsOnSameDays(
          courseName,
          run,
          segment,
          allDates,
          allCourseSegmentsInFy,
        );

        // check if blackout date e.g. -> {"Vesak Day":["2022-05-16T00:00:00.000Z"]
        const blackoutDateClashes: Map<
          string,
          Array<Date>
        > = await this.fiscalYearService.getBlackoutDatesClashes(
          allDates,
          JSON.parse(JSON.stringify(fyInfo.blackout_dates)),
        );

        // check if break low manpower date limit
        const lowManpowerDatesClashes: Map<string, Date> =
          this.getLowManpowerDateClashes(
            courseSegmentsOnSameDays,
            JSON.parse(JSON.stringify(fyInfo.low_manpower_dates)),
          );

        // check if break day limit
        const dayLimitClashes: Array<Date> = this.getDayLimitClashes(
          courseSegmentsOnSameDays,
          JSON.parse(JSON.stringify(fyInfo.day_limit)),
        );

        // check if trainer is available
        const trainerClashes: Map<
          string,
          Array<Date>
        > = await this.trainerService.getTrainerClashes(
          courseSegmentsOnSameDays,
          fy,
          courseName,
          segment,
          run,
          newTrainerList,
        );

        // check if same course is running on same date
        const sameCourseClashes: Array<Date> = await this.getCourseRunClashes(
          courseSegmentsOnSameDays,
          courseName,
        );

        if (
          blackoutDateClashes.size > 0 ||
          lowManpowerDatesClashes.size > 0 ||
          dayLimitClashes.length > 0 ||
          trainerClashes.size > 0 ||
          sameCourseClashes.length > 0
        ) {
          return {
            blackoutDateClashes: Object.fromEntries(blackoutDateClashes),
            lowManpowerDatesClashes: Object.fromEntries(
              lowManpowerDatesClashes,
            ),
            dayLimitClashes: dayLimitClashes,
            trainerClashes: Object.fromEntries(trainerClashes),
            sameCourseClashes: sameCourseClashes,
          };
        }
      }

      delete editCourseSegmentDto.bypass;
      delete editCourseSegmentDto.newTrainerList;

      const oldTrainers =
        await this.trainerService.getAssignmentTrainersByCourseSegments(
          fy,
          courseName,
          segment,
          run,
        );
      const oldTrainerList = oldTrainers.map((trainer) => trainer.user_name);
      const trainersToAdd = newTrainerList.filter(
        (trainer) => !oldTrainerList.includes(trainer),
      );
      const trainersToRemove = oldTrainerList.filter(
        (trainer) => !newTrainerList.includes(trainer),
      );
      const trainerStatus =
        status == Status.GENERATED || status == Status.REVIEWED
          ? status
          : Status.PENDING;

      // Update assignments
      for (const trainer of trainersToAdd) {
        await this.createAssignment({
          user_name: trainer,
          segment: segment,
          course_name: courseName,
          fy: fy,
          run: run,
          assignment_status: trainerStatus,
          decline_reason: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        });
      }
      for (const trainer of trainersToRemove) {
        await this.prisma.assignment.delete({
          where: {
            user_name_segment_course_name_fy_run: {
              segment: segment,
              course_name: courseName,
              fy: fy,
              run: run,
              user_name: trainer,
            },
          },
        });
      }

      // Update dates
      let courseSegment = await this.prisma.courseSegment.update({
        where: {
          segment_course_name_fy_run: {
            segment: segment,
            course_name: courseName,
            fy: fy,
            run: run,
          },
        },
        data: {
          dates: editCourseSegmentDto.dates.map((date) => new Date(date)),
        },
      });

      // Notifications
      // if the dates changed and course status is not PENDING and above
      if (
        (originalSegmentDates.at(0).toISOString() != allDates.at(0) ||
          originalSegmentDates.at(-1).toISOString() != allDates.at(-1)) &&
        trainerStatus != Status.GENERATED &&
        trainerStatus != Status.REVIEWED
      ) {
        const updatedCourseSegment: UpdateCourseSegmentDto = {
          segment: segment,
          run: run,
          course_name: courseName,
          fy: fy,
          new_status: trainerStatus, // will only either be GENERATED / REVIEWED / PENDING
        };
        // notifies everybody if PENDING onwards, if GENERATED or REVIEWED it won't notify
        await this.updateCourseSegmentStatus([updatedCourseSegment]);
        courseSegment.status = trainerStatus;
      } else if (trainerStatus == Status.PENDING) {
        // only trainers changed and got pending assignments
        if (trainersToAdd.length > 0) {
          // notify newly assigned trainers
          await this.notificationsService.notifyNewlyAssignedTrainers(
            trainersToAdd,
            editCourseSegmentDto,
          );
          // update course status since there are any pending assignments
          courseSegment = await this.prisma.courseSegment.update({
            where: {
              segment_course_name_fy_run: {
                segment: segment,
                course_name: courseName,
                fy: fy,
                run: run,
              },
            },
            data: {
              status: Status.PENDING,
            },
          });
        }
      }
      if (trainerStatus == Status.PENDING) {
        // notify unassigned trainers
        await this.notificationsService.notifyUnassignedTrainers(
          trainersToRemove,
          editCourseSegmentDto,
        );
      }
      return courseSegment;
    } catch (e) {
      return e.message;
    }
  }

  getAllDatesBetween(dates: string[]): string[] {
    dates.sort(function (a, b) {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    const allDates: string[] = [];
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates.at(-1));

    let currentDate = startDate;
    const addDays = function (days: number) {
      const date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };

    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString());
      currentDate = addDays.call(currentDate, 1);
    }
    return allDates;
  }

  getCourseRunClashes(
    courseSegmentsOnSameDays: Map<string, CourseSegment[]>,
    courseName: string,
  ): Date[] {
    const sameCourseRunClashes: Date[] = [];
    for (const [date, courseSegments] of courseSegmentsOnSameDays) {
      for (const courseSegment of courseSegments) {
        if (courseSegment.course_name == courseName) {
          sameCourseRunClashes.push(new Date(date));
        }
      }
    }
    return sameCourseRunClashes;
  }

  getLowManpowerDateClashes(
    courseSegmentsOnSameDays: Map<string, CourseSegment[]>,
    // eslint-disable-next-line @typescript-eslint/ban-types
    lowManpowerDates: Object,
  ): Map<string, Date> {
    const lowManpowerDateClashes: Map<string, Date> = new Map();
    for (const [date, courseSegment] of courseSegmentsOnSameDays) {
      const numCourseSegments = courseSegment.length;
      for (const [key, value] of Object.entries(lowManpowerDates)) {
        const lmDates = new Set(value.dates);
        if (lmDates.has(date) && numCourseSegments >= value.day_limit) {
          lowManpowerDateClashes.set(key, new Date(date));
        }
      }
    }
    return lowManpowerDateClashes;
  }

  getDayLimitClashes(
    courseSegmentsOnSameDays: Map<string, CourseSegment[]>,
    day_limit: number,
  ): Date[] {
    const dayLimitClashes: Date[] = [];
    for (const [date, courseSegment] of courseSegmentsOnSameDays) {
      const numCourseSegments = courseSegment.length;
      if (numCourseSegments >= day_limit) {
        dayLimitClashes.push(new Date(date));
      }
    }
    return dayLimitClashes;
  }

  getCourseSegmentsOnSameDays(
    course_name: string,
    run: number,
    segment: number,
    dates: Array<string>,
    allCourseSegmentsInFy: Array<CourseSegment>,
  ) {
    const daysAffected = new Map<string, Array<CourseSegment>>();
    const datesSet = new Set(
      dates.map((date) => new Date(date).toISOString().split("T")[0]),
    );

    for (let i = 0; i < allCourseSegmentsInFy.length; i++) {
      const courseSegment = allCourseSegmentsInFy[i];
      const courseSegmentDates = courseSegment.dates;
      for (let j = 0; j < courseSegmentDates.length; j++) {
        const courseSegmentDate = courseSegmentDates[j]
          .toISOString()
          .split("T")[0];
        if (
          datesSet.has(courseSegmentDate) &&
          !this.arraysEqual(
            [
              courseSegment.course_name,
              courseSegment.run,
              courseSegment.segment,
            ],
            [course_name, run, segment],
          )
        ) {
          if (daysAffected.has(courseSegmentDate)) {
            daysAffected.get(courseSegmentDate).push(courseSegment);
          } else {
            daysAffected.set(courseSegmentDate, [courseSegment]);
          }
        }
      }
    }
    return daysAffected;
  }

  async createCourse(course: CourseDto) {
    return this.prisma.course.upsert({
      where: {
        course_name: course.course_name,
      },
      create: {
        course_name: course.course_name,
        course_code: course.course_code,
        programme_name: course.programme_name,
        delivery_mode: course.delivery_mode,
      },
      update: {
        course_name: course.course_name,
        course_code: course.course_code,
        programme_name: course.programme_name,
        delivery_mode: course.delivery_mode,
      },
    });
  }

  async createCourseRun(courseRun: CourseRun) {
    try {
      return this.prisma.courseRun.create({
        data: courseRun,
      });
    } catch (e) {
      return e;
    }
  }

  async createManyCourses(coursesArr: Array<Course>) {
    try {
      return this.prisma.course.createMany({
        data: coursesArr,
        skipDuplicates: true,
      });
    } catch (e) {
      return e;
    }
  }

  async getProgrammes() {
    return this.prisma.programme.findMany();
  }

  async getProgramme(body: GetProgrammeDto) {
    return this.prisma.programme.findUnique({
      where: { programme_name: body.programme_name },
    });
  }

  async createProgramme(programme: ProgrammeDto) {
    try {
      return this.prisma.programme.create({
        data: programme,
      });
    } catch (e) {
      return e;
    }
  }

  async createManyProgrammes(programmeNameArr: Array<Programme>) {
    try {
      return this.prisma.programme.createMany({
        data: programmeNameArr,
        skipDuplicates: true,
      });
    } catch (e) {
      return e;
    }
  }

  async getCourseConfig(body: GetCourseConfigDto) {
    return this.prisma.courseConfig.findUnique({
      where: {
        course_name_fy: {
          course_name: body.course_name,
          fy: body.fy,
        },
      },
    });
  }

  async getCourseConfigsOfFy(fy: string) {
    return this.prisma.courseConfig.findMany({
      where: {
        fy: fy,
      },
    });
  }

  async createManyCourseConfigs(courseConfigsArr: Array<CourseConfig>) {
    try {
      return this.prisma.courseConfig.createMany({
        data: courseConfigsArr,
        skipDuplicates: true,
      });
    } catch (e) {
      return e;
    }
  }

  async createManyCourseRuns(courseRunsArr: Array<CourseRun>) {
    try {
      return this.prisma.courseRun.createMany({
        data: courseRunsArr,
        skipDuplicates: true,
      });
    } catch (e) {
      return e;
    }
  }

  async getCourseRunsOfFyAndCourse(fy: string, courseName: string) {
    return this.prisma.courseRun.findMany({
      where: {
        fy: fy,
        course_name: courseName,
      },
    });
  }

  async getCourseSegmentsOfFyAndCourse(fy: string, courseName: string) {
    return this.prisma.courseSegment.findMany({
      where: {
        fy: fy,
        course_name: courseName,
      },
    });
  }

  async getCourseSegmentsOfFy(fy: string) {
    return this.prisma.courseSegment.findMany({
      where: {
        fy: fy,
      },
    });
  }

  async createManyCourseSegments(courseSegmentsArr: Array<CourseSegment>) {
    try {
      return this.prisma.courseSegment.createMany({
        data: courseSegmentsArr,
        skipDuplicates: true,
      });
    } catch (e) {
      throw e;
    }
  }

  async createAssignment(assignment: Assignment) {
    try {
      return this.prisma.assignment.create({
        data: assignment,
      });
    } catch (e) {
      return e;
    }
  }

  async createManyAssignments(assignmentsArr: Array<Assignment>) {
    try {
      return this.prisma.assignment.createMany({
        data: assignmentsArr,
        skipDuplicates: true,
      });
    } catch (e) {
      throw e;
    }
  }

  async updateCourseSegmentStatus(courseSegmentArr: UpdateCourseSegmentDto[]) {
    try {
      const resultsArray = [];

      for (let i = 0; i < courseSegmentArr.length; i++) {
        const updateCourseSegment = await this.prisma.courseSegment.update({
          where: {
            segment_course_name_fy_run: {
              segment: courseSegmentArr[i].segment,
              course_name: courseSegmentArr[i].course_name,
              fy: courseSegmentArr[i].fy,
              run: courseSegmentArr[i].run,
            },
          },
          data: {
            status: courseSegmentArr[i].new_status,
          },
        });
        resultsArray.push(updateCourseSegment);

        let decline_reason = "";
        if (courseSegmentArr[i].new_status === "DECLINED") {
          decline_reason = "Declined by PM";
        }

        await this.prisma.assignment.updateMany({
          where: {
            segment: courseSegmentArr[i].segment,
            course_name: courseSegmentArr[i].course_name,
            fy: courseSegmentArr[i].fy,
            run: courseSegmentArr[i].run,
          },
          data: {
            assignment_status: courseSegmentArr[i].new_status,
            decline_reason: decline_reason,
          },
        });
      }
      await this.notificationsService.notifyTrainersBySegments(resultsArray);
      return resultsArray;
    } catch (e) {
      return e;
    }
  }

  async updateAssignmentStatus(AssignmentArr: AssignmentDto[]) {
    try {
      const resultsArray = [];

      for (let i = 0; i < AssignmentArr.length; i++) {
        const updateAssignmentStatus = await this.prisma.assignment.update({
          where: {
            user_name_segment_course_name_fy_run: {
              user_name: AssignmentArr[i].user_name,
              segment: AssignmentArr[i].segment,
              course_name: AssignmentArr[i].course_name,
              fy: AssignmentArr[i].fy,
              run: AssignmentArr[i].run,
            },
          },
          data: {
            assignment_status: AssignmentArr[i].new_status,
            decline_reason: AssignmentArr[i].decline_reason,
          },
        });
        resultsArray.push(updateAssignmentStatus);

        const allAssignmentStatus = await this.prisma.assignment.findMany({
          where: {
            segment: AssignmentArr[i].segment,
            course_name: AssignmentArr[i].course_name,
            fy: AssignmentArr[i].fy,
            run: AssignmentArr[i].run,
          },
          select: {
            assignment_status: true,
          },
        });
        const assignmentStatusArray = allAssignmentStatus.map(
          (assignment) => assignment.assignment_status,
        );

        if (assignmentStatusArray.includes("DECLINED")) {
          const updatedCourseSegmentStatus =
            await this.prisma.courseSegment.update({
              where: {
                segment_course_name_fy_run: {
                  segment: AssignmentArr[i].segment,
                  course_name: AssignmentArr[i].course_name,
                  fy: AssignmentArr[i].fy,
                  run: AssignmentArr[i].run,
                },
              },
              data: {
                status: "DECLINED",
              },
            });
        }

        const allEqual = assignmentStatusArray.every(
          (val) => val === "ACCEPTED",
        );

        if (allEqual) {
          const updatedCourseSegmentStatus =
            await this.prisma.courseSegment.update({
              where: {
                segment_course_name_fy_run: {
                  segment: AssignmentArr[i].segment,
                  course_name: AssignmentArr[i].course_name,
                  fy: AssignmentArr[i].fy,
                  run: AssignmentArr[i].run,
                },
              },
              data: {
                status: "ACCEPTED",
              },
            });
        }
      }
      return resultsArray;
    } catch (e) {
      return e;
    }
  }

  async removeScheduledCourseRun(courseRun: CourseRunDto) {
    try {
      return this.prisma.courseRun.delete({
        where: {
          run_course_name_fy: {
            run: courseRun.run,
            course_name: courseRun.course_name,
            fy: courseRun.fy,
          },
        },
      });
    } catch (e) {
      return e;
    }
  }

  async exportCourseSegment(dto: FilterDto): Promise<CourseSegment[]> {
    const courseSegments = await this.getFilterResults(dto);
    if (dto.export_by_trainer) {
      return this.formatFilterResults(courseSegments);
    }
    return courseSegments;
  }

  formatFilterResults(courseSegments: CourseSegment[]) {
    for (let i = 0; i < courseSegments.length; i++) {
      const re = /:V[0-9]$/;
      courseSegments[i].course_name = courseSegments[i].course_name.replace(
        re,
        "",
      );
    }
    return courseSegments;
  }

  async createNewCourse(body: CreateNewCourseDto) {
    const programme = await this.getProgramme({
      programme_name: body.programme_name,
    });
    if (programme == null) {
      await this.createProgramme({ programme_name: body.programme_name });
    }
    await this.createCourse({
      course_name: body.course_name,
      programme_name: body.programme_name,
      course_code: body.course_code,
      delivery_mode: body.delivery_mode,
    });

    const trainers = {};
    for (const trainer of body.trainers) {
      for (const [name, dates] of Object.entries(trainer)) {
        trainers[name] = dates;
      }
    }

    const courseConfig = await this.createManyCourseConfigs([
      {
        course_name: body.course_name,
        fy: body.fy,
        days_per_run: body.days_per_run,
        runs_per_year: body.runs_per_year,
        course_fees: body.course_fees,
        start_time: this.formatTime(body.start_time),
        end_time: this.formatTime(body.end_time),
        days_to_avoid: body.days_to_avoid,
        avoid_month_start: body.avoid_month_start,
        avoid_month_end: body.avoid_month_end,
        split: [],
        trainers: trainers,
        createdAt: undefined,
        updatedAt: undefined,
      },
    ]);

    return courseConfig;
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

    const assignmentQuery = {};
    if (trainers.length !== 0) {
      assignmentQuery["user_name"] = { in: trainers };
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
            days_per_run: true,
            runs_per_year: true,
            course_fees: true,
            days_to_avoid: true,
            avoid_month_start: true,
            avoid_month_end: true,
            trainers: true,
            CourseRun: {
              select: {
                CourseSegment: {
                  where: courseSegmentQuery,
                  select: {
                    Assignment: {
                      where: assignmentQuery,
                    },
                    course_name: true,
                    dates: true,
                    status: true,
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
              days_per_run: response[c].CourseConfig[r].days_per_run,
              runs_per_year: response[c].CourseConfig[r].runs_per_year,
              course_fees:
                response[c].CourseConfig[r].course_fees.toLocaleString("en-SG"),
              days_to_avoid:
                response[c].CourseConfig[r].days_to_avoid.join(", "),
              avoid_month_start: response[c].CourseConfig[r].avoid_month_start,
              avoid_month_end: response[c].CourseConfig[r].avoid_month_end,
              trainers: Object.keys(
                JSON.parse(
                  JSON.stringify(response[c].CourseConfig[r].trainers),
                ),
              ).join(", "),
              ...assignment[0],
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

  async filterCourses(dto: CourseFilterDto) {
    // filter by programme - Course model
    // filter by course_name - Course model
    // filter by delivery_mode - Course model
    // filter by status - Course Segment model
    // filter by trainer - Assignment model

    const programme_name: Array<string> = dto.programme_name;
    const course_name: Array<string> = dto.course_name;
    const delivery_mode: Array<DeliveryMode> = dto.delivery_mode;
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

    const response = await this.prisma.course.findMany({
      where: courseQuery,
      select: {
        course_name: true,
        course_code: true,
        programme_name: true,
        delivery_mode: true,
        CourseConfig: {
          where: courseSegmentQuery,
          select: {
            days_per_run: true,
            course_fees: true,
            createdAt: true,
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
        },
      },
    });

    const courses = [];

    for (let c = 0; c < response.length; c++) {
      let trainerExists: boolean = trainers.length == 0 ? true : false;
      // courseConfig
      const courseConfig = response[c].CourseConfig[0];
      const allTrainers: Set<string> = new Set();
      // courseRun
      if (response[c].CourseConfig.length > 0) {
        const courseRun = courseConfig.CourseRun;
        for (let s = 0; s < courseRun.length; s++) {
          // courseSegment
          const courseSegment = courseConfig.CourseRun[s].CourseSegment;
          for (let a = 0; a < courseSegment.length; a++) {
            // assignment
            const assignment = courseSegment[a].Assignment;
            if (assignment.length == 0) {
              continue;
            }
            for (let i = 0; i < assignment.length; i++) {
              if (trainers.includes(assignment[i].user_name)) {
                trainerExists = true;
              }
              allTrainers.add(assignment[i].user_name);
            }
          }
        }
      }

      if (!trainerExists) {
        continue;
      }

      if (response[c].CourseConfig.length != 0) {
        const output = {
          programme_name: response[c].programme_name,
          course_name: response[c].course_name,
          course_code: response[c].course_code,
          delivery_mode: response[c].delivery_mode,
          course_fees: courseConfig.course_fees.toLocaleString("en-SG"),
          days_per_run: courseConfig.days_per_run,
          createdAt: courseConfig.createdAt,
          trainers: Array.from(allTrainers).join(", "),
        };
        courses.push(output);
      }
    }
    return courses;
  }

  // ======================================= HELPER FUNCTIONS ==========================================

  exportCourseSegmentToExcel(courseSegments: CourseSegment[]) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Course Segment");

    const columns = [
      { header: "FY", key: "fy", width: 10 },
      { header: "Programme Name", key: "programme_name", width: 30 },
      { header: "Course Name", key: "course_name", width: 25 },
      { header: "Start Date", key: "start_date", width: 10 },
      { header: "End Date", key: "end_date", width: 10 },
      { header: "Course Code", key: "course_code", width: 10 },
      { header: "Delivery Mode", key: "delivery_mode", width: 12 },
      { header: "Trainer(s)", key: "user_name", width: 15 },
      { header: "Run", key: "run", width: 5 },
      { header: "Session", key: "segment", width: 7 },
      { header: "Start Time", key: "start_time", width: 9 },
      { header: "End Time", key: "end_time", width: 8 },
      { header: "Status", key: "status", width: 10 },
      { header: "Days per Run", key: "days_per_run", width: 11 },
      { header: "Runs per Year", key: "runs_per_year", width: 11 },
      { header: "Course Fees", key: "course_fees", width: 10 },
      { header: "Days to Avoid", key: "days_to_avoid", width: 11 },
      { header: "Avoid Month Start", key: "avoid_month_start", width: 15 },
      { header: "Avoid Month End", key: "avoid_month_end", width: 14 },
      { header: "Trainers", key: "trainers", width: 8 },
    ];

    courseSegments.forEach((courseSegment) => {
      courseSegment["start_date"] = courseSegment.dates[0]
        .toISOString()
        .split("T")[0];
      courseSegment["end_date"] = courseSegment.dates
        .at(-1)
        .toISOString()
        .split("T")[0];
    });

    worksheet.columns = columns;
    [
      "A1",
      "B1",
      "C1",
      "D1",
      "E1",
      "F1",
      "G1",
      "H1",
      "I1",
      "J1",
      "K1",
      "L1",
      "M1",
      "N1",
      "O1",
      "P1",
      "Q1",
      "R1",
      "S1",
      "T1",
    ].map((cell) => {
      worksheet.getCell(cell).font = { bold: true, color: { argb: "FFFFFF" } };
      worksheet.getCell(cell).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "ff203070" },
      };
    });

    worksheet.addRows(courseSegments);
    return workbook;
  }

  dayOfWeekAsString(dayIndex: number) {
    return (
      [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][dayIndex] || ""
    );
  }

  arraysEqual(a: Array<any>, b: Array<any>) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  formatTime(timeString: null | string): Date | null {
    if (timeString == null) {
      return null;
    }
    const date = new Date();
    const [hours, minutes] = timeString.split(":");
    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));
    return date;
  }
}
