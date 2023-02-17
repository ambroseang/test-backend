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
import { CellValue } from "exceljs";
import { Month, Weeks, Year } from "src/interfaces/calendar.interface";
import {
  BlackoutDates,
  LowManpowerDates,
} from "src/interfaces/new_schedule_inputs.interface";

export class SchedulerHelper {
  splitCoursesByPriority(courses: CourseConfig[]): CourseConfig[][] {
    const firstPriorityCourses = [];
    const secondPriorityCourses = [];
    courses.forEach((course) => {
      if (
        course.days_to_avoid.length != 0 ||
        course.avoid_month_end ||
        course.avoid_month_start
      ) {
        firstPriorityCourses.push(course);
      } else {
        secondPriorityCourses.push(course);
      }
    });
    return [firstPriorityCourses, secondPriorityCourses];
  }

  generateDatesFromWeek(
    year: number,
    month: number,
    bestWeek: number,
    bestDayToStart: number,
    numDays: number,
  ): Date[] {
    const startDate: Date = this.generateDateFromWeek(
      year,
      month,
      bestWeek,
      bestDayToStart,
    );
    const startDateOfMonth: number = startDate.getDate();

    const dates: Date[] = [];
    for (let d = 0; d < numDays; d++) {
      const date: Date = new Date(year, month, startDateOfMonth + d, 12);
      dates.push(date);
    }
    return dates;
  }

  generateDateFromWeek(
    year: number,
    month: number,
    week: number,
    day: number,
  ): Date {
    const ww: number = week;
    const firstDayOfMonth: number = new Date(year, month, 1).getDay() - 1;
    const dayDiff: number = day - firstDayOfMonth;
    const startDateOfMonth: number = ww * 7 + dayDiff + 1;
    return new Date(year, month, startDateOfMonth);
  }

  constructManyProgramme(
    courseInfoRowObjects: Array<Map<string, CellValue>>,
  ): Array<Programme> {
    const arrProgrammes: Programme[] = [];
    for (const courseInfoRow of courseInfoRowObjects) {
      if (courseInfoRow.size != 0) {
        let programme_name: string;
        if (courseInfoRow.has("programme_name")) {
          programme_name = courseInfoRow.get("programme_name").toString();
        } else {
          programme_name = courseInfoRow.get("course_name").toString();
        }
        const programme: Programme = {
          programme_name: programme_name,
          createdAt: undefined,
          updatedAt: undefined,
        };
        arrProgrammes.push(programme);
      }
    }
    return arrProgrammes;
  }

  constructManyCourses(
    courseInfoRowObjects: Array<Map<string, CellValue>>,
  ): Array<Course> {
    const arrCourses: Course[] = [];
    for (const courseInfoRow of courseInfoRowObjects) {
      if (courseInfoRow.size != 0) {
        let programme_name: string;
        if (courseInfoRow.has("programme_name")) {
          programme_name = courseInfoRow.get("programme_name").toString();
        } else {
          programme_name = courseInfoRow.get("course_name").toString();
        }
        const course: Course = {
          course_name: courseInfoRow.get("course_name").toString(),
          programme_name: programme_name,
          course_code: courseInfoRow.get("course_code").toString(),
          delivery_mode:
            DeliveryMode[
              courseInfoRow.get("delivery_mode").toString().toUpperCase()
            ],
          createdAt: undefined,
          updatedAt: undefined,
        };
        arrCourses.push(course);
      }
    }
    return arrCourses;
  }

  constructManyCourseConfigs(
    courseInfoRowObjects: Array<Map<string, CellValue>>,
    fy: string,
  ): [CourseConfig[], CourseConfig[], CourseConfig[][]] {
    const arrCourseConfigs: CourseConfig[] = [];
    const coursesToGenerate: CourseConfig[] = [];
    const multiModuleToGenerate: CourseConfig[][] = [];

    const tempHolder: Map<string, CourseConfig[]> = new Map();

    for (const courseInfoRow of courseInfoRowObjects) {
      if (courseInfoRow.size != 0) {
        const programme: string = courseInfoRow.has("programme_name")
          ? courseInfoRow.get("programme_name").toString()
          : courseInfoRow.get("course_name").toString();

        const start_time: Date = courseInfoRow.has("start_time")
          ? new Date(courseInfoRow.get("start_time").toString())
          : null;
        const end_time: Date = courseInfoRow.has("end_time")
          ? new Date(courseInfoRow.get("end_time").toString())
          : null;
        const days_to_avoid: number[] = courseInfoRow.has("days_to_avoid")
          ? courseInfoRow.get("days_to_avoid").toString().split(",").map(Number)
          : [];
        // let preferred_weeks: number[] = (courseInfoRow.has('preferred_weeks')) ? courseInfoRow.get('preferred_weeks').toString().split(',').map(Number) : [];
        const avoid_month_start: boolean =
          courseInfoRow.has("avoid_month_start") &&
          courseInfoRow.get("avoid_month_start") == "Y"
            ? true
            : false;
        const avoid_month_end: boolean =
          courseInfoRow.has("avoid_month_end") &&
          courseInfoRow.get("avoid_month_end") == "Y"
            ? true
            : false;
        const split: number[] = courseInfoRow.has("split")
          ? courseInfoRow.get("split").toString().split("-").map(Number)
          : [];
        const trainers: Prisma.JsonObject = this.formatTrainers(
          courseInfoRow.get("trainers").toString(),
          Number(courseInfoRow.get("days_per_run")),
        );

        const courseConfig: CourseConfig = {
          course_name: courseInfoRow.get("course_name").toString(),
          fy: fy,
          days_per_run: Number(courseInfoRow.get("days_per_run")),
          runs_per_year: Number(courseInfoRow.get("runs_per_year")),
          course_fees: Number(courseInfoRow.get("course_fees")),
          start_time: start_time,
          end_time: end_time,
          days_to_avoid: days_to_avoid,
          avoid_month_start: avoid_month_start,
          avoid_month_end: avoid_month_end,
          split: split,
          trainers: trainers,
          createdAt: undefined,
          updatedAt: undefined,
        };

        arrCourseConfigs.push(courseConfig);

        if (courseInfoRow.get("to_generate") === "Y") {
          if (tempHolder.has(programme)) {
            tempHolder.get(programme).push(courseConfig);
          } else {
            tempHolder.set(programme, [courseConfig]);
          }
        }
      }
    }

    for (const [, configs] of tempHolder) {
      if (configs.length > 1) {
        multiModuleToGenerate.push(configs);
      } else {
        coursesToGenerate.push(configs[0]);
      }
    }

    return [arrCourseConfigs, coursesToGenerate, multiModuleToGenerate];
  }

  constructCourseRun(courseName: string, fy: string, run: number): CourseRun {
    const courseRun: CourseRun = {
      course_name: courseName,
      fy: fy,
      run: run,
      createdAt: undefined,
      updatedAt: undefined,
    };
    return courseRun;
  }

  constructCourseSegment(
    courseName: string,
    fy: string,
    run: number,
    segment: number,
    dates: Date[],
  ): CourseSegment {
    const courseSegment: CourseSegment = {
      course_name: courseName,
      fy: fy,
      run: run,
      segment: segment,
      status: Status.GENERATED,
      dates: dates,
      createdAt: undefined,
      updatedAt: undefined,
    };
    return courseSegment;
  }

  constructAssignment(
    courseName: string,
    fy: string,
    run: number,
    segment: number,
    trainer: string,
  ): Assignment {
    const assignment: Assignment = {
      course_name: courseName,
      fy: fy,
      run: run,
      segment: segment,
      user_name: trainer,
      assignment_status: Status.GENERATED,
      decline_reason: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    return assignment;
  }

  constructFyData(
    dayLimit: number,
    blackoutPeriods: any,
    decreasedManpowerPeriods: any,
  ): object {
    const fyData = {
      day_limit: dayLimit,
      blackout_dates: blackoutPeriods,
      low_manpower_dates: decreasedManpowerPeriods,
    };
    return fyData;
  }

  formatTrainers(trainers: string, daysPerRun: number): Prisma.JsonObject {
    const trainersArr: string[] = trainers.split(";");
    const baseArr: Prisma.JsonArray = Array.from(
      { length: daysPerRun },
      (_, i) => i + 1,
    );
    const trainerTeachingDaysMap: Prisma.JsonObject = {};

    for (const trainer of trainersArr) {
      let trainerName = trainer;
      let daysToTeach = baseArr;
      if (trainer.includes("(") && trainer.includes(")")) {
        const matches = trainer.match(/\((.*?)\)/);
        daysToTeach = matches[1].split(",").map(Number);
        trainerName = trainer.substring(0, trainer.indexOf("("));
      }
      trainerTeachingDaysMap[trainerName] = daysToTeach;
    }

    return trainerTeachingDaysMap;
  }

  initYear(
    y: number,
    maxCourseRunsPerDay: number,
    startMonth: number,
    endMonth: number,
  ): Year {
    const year: Year = {};
    for (let m: number = startMonth; m <= endMonth; m++) {
      // APRIL TO DECEMBER (Jan is 0)
      const month: Month = { weeks: {} };
      const weeks: Weeks = {};
      const lastDayDate: Date = new Date(y, m + 1, 0);
      const lastDay: number = lastDayDate.getDate();
      // if (lastDayDate.getDay() == 0) {
      //   lastDay -= 2
      // } else if (lastDayDate.getDay() == 6) {
      //   lastDay -= 1
      // }
      const firstDayDate: Date = new Date(y, m, 1);
      let day = 1; //eg. 31st, 28th 2nd - of the month
      let dayOfTheWeek: number = firstDayDate.getDay(); //eg. Mon(1), Tues(2) - of the week
      let currentWeek = 0;
      let currentWeekArr: number[] = new Array(5).fill(0);
      // Setting initial state
      if (dayOfTheWeek === 6) {
        weeks[currentWeek] = currentWeekArr;
        dayOfTheWeek = 1;
        day = 3;
        currentWeek = 1;
        currentWeekArr = new Array(5).fill(0);
      } else if (dayOfTheWeek === 0) {
        dayOfTheWeek = 1;
        day = 2;
      }
      while (day <= lastDay) {
        currentWeekArr[dayOfTheWeek - 1] = maxCourseRunsPerDay;
        dayOfTheWeek++;
        if (dayOfTheWeek === 6) {
          weeks[currentWeek] = currentWeekArr;
          currentWeekArr = Array(5).fill(0);
          day += 2;
          currentWeek++;
          dayOfTheWeek = 1;
        }
        day++;
      }

      if (this.sumArray(currentWeekArr) !== 0) {
        weeks[currentWeek] = currentWeekArr;
      }

      month["weeks"] = weeks;
      year[m] = month;
    }

    return year;
  }

  getWeekFromDate(date: Date): number {
    const yy = date.getFullYear();
    const mm = date.getMonth();
    const dd = date.getDate();
    const dayOfWeek = date.getDay();
    const firstDayOfMonth = new Date(yy, mm, 1).getDay();
    const dayDiff = dayOfWeek - firstDayOfMonth + 1;
    const week: number = (dd - dayDiff) / 7;
    return week;
  }

  sumArray(arr: number[]): number {
    return arr.reduce((a, b) => a + Number(b), 0);
  }

  parseBlackoutDates(blackoutString: string): BlackoutDates {
    const parsedBlackoutDates = {};
    const blackoutPeriods: object = JSON.parse(blackoutString);
    for (const period in blackoutPeriods) {
      const dates: Date[] = [];
      const startDate: Date = new Date(blackoutPeriods[period]["start"]);
      const endDate: Date = new Date(blackoutPeriods[period]["end"]);
      let currentDate: Date = new Date(startDate);
      while (currentDate.getTime() !== endDate.getTime()) {
        dates.push(currentDate);
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      dates.push(endDate);
      parsedBlackoutDates[period] = dates;
    }
    return parsedBlackoutDates;
  }

  parseLowManpowerDates(lowManpowerString: string): LowManpowerDates {
    const parsedLowManpowerDates = {};
    const lowManpowerPeriods: object = JSON.parse(lowManpowerString);
    for (const period in lowManpowerPeriods) {
      const lowManpowerPeriod = {};
      const dates: Date[] = [];
      const startDate: Date = new Date(lowManpowerPeriods[period]["start"]);
      const endDate: Date = new Date(lowManpowerPeriods[period]["end"]);
      let currentDate: Date = new Date(startDate);
      while (currentDate.getTime() !== endDate.getTime()) {
        dates.push(currentDate);
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      dates.push(endDate);
      lowManpowerPeriod["dates"] = dates;
      lowManpowerPeriod["day_limit"] = lowManpowerPeriods[period]["day_limit"];
      parsedLowManpowerDates[period] = lowManpowerPeriod;
    }
    return parsedLowManpowerDates;
  }

  determineDayLimit(
    lowManpowerPeriods: {},
    date: Date,
    defaultCap: number,
  ): number {
    for (const period of Object.values(lowManpowerPeriods)) {
      const dates: number[] = period["dates"].map((d) => new Date(d).getTime());

      if (dates.includes(date.getTime())) {
        return period["day_limit"];
      }
    }
    return defaultCap;
  }
}
