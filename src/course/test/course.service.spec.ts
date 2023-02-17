import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { CourseController } from "../course.controller";
import { CourseService } from "../course.service";
import {
  assignmentData,
  courseConfigData,
  courseData,
  courseRunData,
  courseSegmentData,
  db,
  oneAssignment,
  oneCourse,
  oneCourseConfig,
  oneCourseRun,
  oneCourseSegment,
  oneNewCourse,
  oneProgramme,
  programmeData,
} from "../../../test/data";
import { FiscalYearService } from "src/fiscal-year/fiscal-year.service";
import { TrainerService } from "src/trainer/trainer.service";
import { FilterDto, fyDto } from "src/scheduler/dto";
import { NotificationsService } from "../../notifications/notifications.service";
import {
  CourseFilterDto,
  EditCourseSegmentDto,
  GetCourseConfigDto,
  GetProgrammeDto,
  ProgrammeDto,
} from "../dto";
import { Assignment, CourseRun, Status } from "@prisma/client";
import { Workbook } from "exceljs";

describe("Course Service", () => {
  let service: CourseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseController],
      providers: [
        CourseService,
        FiscalYearService,
        TrainerService,
        {
          provide: NotificationsService,
          useValue: {
            notifyTrainersBySegments: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
  });

  it("Course Service should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCourses", () => {
    it("should return an array of courses", async () => {
      const fyDto: fyDto = {
        fy: "2020-2021",
      };
      const courses = await service.getCourses(fyDto);
      expect(JSON.stringify(courses)).toEqual(
        '[{"course_fees":"300","days":3,"trainers":["Ash Ketchum"]},{"course_fees":"500","days":4,"trainers":["Ash Ketchum"]}]',
      );
    });
  });

  describe("getCourseDetails", () => {
    it("returns a course details", async () => {
      const queryResults = oneCourseConfig;
      queryResults["Course"] = oneCourse;
      const courseDetails = await service.getCourseDetails(queryResults);
      expect(courseDetails).toEqual(queryResults);
    });
  });

  describe("createCourse", () => {
    it("should create a course and return the created course", async () => {
      const course = await service.createCourse(oneCourse);
      expect(course).toEqual(oneCourse);
    });
  });

  describe("createNewCourse", () => {
    it("should create a new course and return the created course", async () => {
      const course = await service.createNewCourse(oneNewCourse);
      expect(course).toEqual(courseConfigData);
    });
  });

  describe("createManyCourses", () => {
    it("should create a course and return the created course", async () => {
      const courseArr = await service.createManyCourses([
        oneCourse,
        courseData[1],
      ]);
      expect(courseArr).toEqual([oneCourse, courseData[1]]);
    });
  });

  describe("getProgrammes", () => {
    it("should return an array of courses", async () => {
      const programmes = await service.getProgrammes();
      expect(programmes).toEqual(programmeData);
    });
  });

  describe("getProgramme", () => {
    it("should return an array of courses", async () => {
      const input: GetProgrammeDto = oneProgramme;
      const output = await service.getProgramme(input);
      expect(output).toEqual(oneProgramme);
    });
  });

  describe("createProgramme", () => {
    it("should return the created programme", async () => {
      const input: ProgrammeDto = oneProgramme;
      const output = await service.createProgramme(input);
      expect(output).toEqual(oneProgramme);
    });
  });

  describe("createManyProgrammes", () => {
    it("should create a course and return the created course", async () => {
      const programmeArr = await service.createManyProgrammes([
        oneProgramme,
        programmeData[1],
      ]);
      expect(programmeArr).toEqual([oneProgramme, programmeData[1]]);
    });
  });

  describe("createManyCourseConfigs", () => {
    it("should create a course config and return the created course config", async () => {
      const courseConfigArr = await service.createManyCourseConfigs([
        oneCourseConfig,
        courseConfigData[1],
      ]);
      expect(courseConfigArr).toEqual([oneCourseConfig, courseConfigData[1]]);
    });
  });

  describe("createManyCourseRuns", () => {
    it("should create a course run and return the created course run", async () => {
      const courseRunArr = await service.createManyCourseRuns([
        oneCourseRun,
        courseRunData[1],
      ]);
      expect(courseRunArr).toEqual([oneCourseRun, courseRunData[1]]);
    });
  });

  describe("createManyCourseSegments", () => {
    it("should create a course segment and return the created course segment", async () => {
      const courseSegmentArr = await service.createManyCourseSegments([
        oneCourseSegment,
        courseSegmentData[1],
      ]);
      expect(courseSegmentArr).toEqual([
        oneCourseSegment,
        courseSegmentData[1],
      ]);
    });
  });

  describe("createManyAssignments", () => {
    it("should create a assignments and return the created assignments", async () => {
      const assignmentArr = await service.createManyAssignments([
        oneAssignment,
        assignmentData[1],
      ]);
      expect(assignmentArr).toEqual([oneAssignment, assignmentData[1]]);
    });
  });

  describe("removeCourse", () => {
    it("should remove a course config", async () => {
      const courseConfigArr = await service.removeCourse({
        course_name: "Python 101",
        fy: "2023-2024",
      });
      expect(courseConfigArr).toEqual(oneCourseConfig);
    });
  });

  describe("removeScheduledCourseRun", () => {
    it("should remove a course run", async () => {
      const courseConfigArr = await service.removeScheduledCourseRun({
        run: 1,
        course_name: "Python 101",
        fy: "2023-2024",
      });
      expect(courseConfigArr).toEqual(oneCourseRun);
    });
  });

  describe("updatedCourseSegmentStatus", () => {
    it("should update the status of a course segment", async () => {
      const courseSegmentArr = await service.updateCourseSegmentStatus([
        {
          segment: 1,
          run: 1,
          course_name: "Python 101",
          fy: "2023-2024",
          new_status: "GENERATED",
        },
      ]);
      expect(courseSegmentArr).toEqual([oneCourseSegment]);
    });
  });

  describe("updatedAssignmentStatus", () => {
    it("should update the status of an assignment", async () => {
      const AssignmentArr = await service.updateAssignmentStatus([
        {
          user_name: "Ash Ketchum",
          segment: 1,
          run: 1,
          course_name: "Python 101",
          fy: "2023-2024",
          new_status: "ACCEPTED",
          decline_reason: "",
        },
      ]);
      expect(AssignmentArr).toEqual([oneAssignment]);
    });
  });

  describe("getCourseConfig", () => {
    it("should return course config", async () => {
      const input: GetCourseConfigDto = oneCourseConfig;
      const output = await service.getCourseConfig(input);
      expect(output).toEqual(oneCourseConfig);
    });
  });

  describe("getCourseConfigsOfFy", () => {
    it("should return course config fy", async () => {
      const input = "2023-2024";
      const output = await service.getCourseConfigsOfFy(input);
      expect(output).toEqual(courseConfigData);
    });
  });

  describe("getCourseRunsOfFyAndCourse", () => {
    it("should return course config by fy and course", async () => {
      const fy = "2023-2024";
      const courseName = "Introduction to Python";
      const output = await service.getCourseRunsOfFyAndCourse(fy, courseName);
      expect(output).toEqual(courseRunData);
    });
  });

  describe("getCourseSegmentsOfFyAndCourse", () => {
    it("should return course segment by fy and course", async () => {
      const fy = "2023-2024";
      const courseName = "Introduction to Python";
      const output = await service.getCourseSegmentsOfFyAndCourse(
        fy,
        courseName,
      );
      expect(output).toEqual(courseSegmentData);
    });
  });

  describe("getCourseSegmentsOfFy", () => {
    it("should return course segment by fy", async () => {
      const fy = "2023-2024";
      const output = await service.getCourseSegmentsOfFy(fy);
      expect(output).toEqual(courseSegmentData);
    });
  });

  describe("createAssignment", () => {
    it("should return the created assignment", async () => {
      const input: Assignment = oneAssignment;
      const output = await service.createAssignment(input);
      expect(output).toEqual(oneAssignment);
    });
  });

  describe("editScheduledCourseRun", () => {
    it("should edit scheduled course run", async () => {
      const input: EditCourseSegmentDto = {
        dates: [new Date().toISOString()],
        course_name: oneCourse.course_name,
        fy: "2023-2024",
        segment: oneCourseSegment.segment,
        run: oneCourseRun.run,
        bypass: 1,
        newTrainerList: ["Ash Ketchum"],
        status: Status.GENERATED,
      };
      const output = await service.editScheduledCourseRun(input);
      expect(output).toEqual(oneCourseSegment);
    });
  });

  describe("createCourseRun", () => {
    it("should create a course run", async () => {
      const input: CourseRun = oneCourseRun;
      const output = await service.createCourseRun(input);
      expect(output).toEqual(oneCourseRun);
    });
  });

  describe("exportCourseSegmentToExcel", () => {
    it("should return workbook", async () => {
      const output = await service.exportCourseSegmentToExcel(
        courseSegmentData,
      );
      expect(output).toBeInstanceOf(Workbook);
    });
  });

  describe("dayOfWeekAsString", () => {
    it("should return the correct day", async () => {
      const output = await service.dayOfWeekAsString(0); // starts from "Sunday"
      expect(output).toBe("Sunday");
    });
  });

  describe("arraysEqual", () => {
    it("should return true if the 2 arrays are equal", async () => {
      const output = await service.arraysEqual(["1"], ["1"]);
      expect(output).toBeTruthy();
    });
  });

  describe("formatTime", () => {
    it("should return date if input is a time string", async () => {
      const currentDate = new Date();
      currentDate.setHours(9);
      currentDate.setMinutes(42);
      currentDate.setSeconds(0);
      const output = await service.formatTime("09:42");
      output.setSeconds(0);
      expect(output).toStrictEqual(currentDate);
    });
  });

  describe("formatTime", () => {
    it("should return null if input is null", async () => {
      const output = await service.formatTime(null);
      expect(output).toBeNull();
    });
  });

  // exportCourseSegment && getFilterResults
  describe("exportCourseSegment", () => {
    db.course.findMany.mockResolvedValue([
      {
        course_name: "Python 101",
        programme_name: "Introduction to Python",
        course_code: "111",
        delivery_mode: "F2F",
        createdAt: new Date(),
        updatedAt: new Date(),
        course_fees: 300,
        days: 3,
        trainers: ["Ash Ketchum"],
        CourseConfig: [
          {
            ...courseConfigData[0],
            CourseRun: {
              ...courseRunData[0],
              CourseSegment: {
                ...courseSegmentData[0],
                Assignment: {
                  ...assignmentData[0],
                },
              },
            },
          },
        ],
      },
      {
        course_name: "Python 122",
        programme_name: "Data Structure and Algorithm",
        course_code: "112",
        delivery_mode: "F2F",
        createdAt: new Date(),
        updatedAt: new Date(),
        course_fees: 500,
        days: 4,
        trainers: ["Ash Ketchum"],
        CourseConfig: [
          {
            ...courseConfigData[1],
            CourseRun: {
              ...courseRunData[1],
              CourseSegment: {
                ...courseSegmentData[1],
                Assignment: {
                  ...assignmentData[1],
                },
              },
            },
          },
        ],
      },
    ]);

    const filter: FilterDto = {
      fy: "2023-2024",
      programme_name: [],
      course_name: [],
      delivery_mode: [],
      status: [],
      trainers: [],
      export_by_trainer: false,
    };

    const courseFilter: CourseFilterDto = {
      fy: "2023-2024",
      programme_name: [],
      course_name: [],
      delivery_mode: [],
      trainers: [],
    };

    const courseFilterRes = [
      {
        course_code: "111",
        course_fees: "300",
        course_name: "Python 101",
        days_per_run: 3,
        delivery_mode: "F2F",
        programme_name: "Introduction to Python",
        trainers: "",
      },
      {
        course_code: "112",
        course_fees: "500",
        course_name: "Python 122",
        days_per_run: 4,
        delivery_mode: "F2F",
        programme_name: "Data Structure and Algorithm",
        trainers: "",
      },
    ];

    it("should return course run", async () => {
      const output = await service.filterCourses(courseFilter);
      output.forEach((course) => {
        delete course.createdAt;
      });
      expect(output).toStrictEqual(courseFilterRes);
    });

    it("should return course run filter results", async () => {
      const output = await service.getFilterResults(filter);
      expect(output).toStrictEqual([]);
    });

    it("should return courseSegments", async () => {
      const output = await service.exportCourseSegment(filter);
      expect(output).toStrictEqual([]);
    });
  });
});
