import { Test, TestingModule } from "@nestjs/testing";
import { FiscalYearService } from "src/fiscal-year/fiscal-year.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { PrismaService } from "src/prisma/prisma.service";
import { TrainerService } from "src/trainer/trainer.service";
import { db } from "../../../test/data";
import { CourseController } from "../course.controller";
import { CourseService } from "../course.service";

describe("Course Controller", () => {
  let controller: CourseController;

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

    controller = module.get<CourseController>(CourseController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getCourses", () => {
    it("should be defined", async () => {
      expect(controller.getCourses).toBeDefined();
    });
  });

  describe("filterCourses", () => {
    it("should be defined", async () => {
      expect(controller.filterCourses).toBeDefined();
    });
  });

  describe("getCourseDetails", () => {
    it("should be defined", async () => {
      expect(controller.getCourseDetails).toBeDefined();
    });
  });

  describe("deleteCourse", () => {
    it("should be defined", async () => {
      expect(controller.deleteCourse).toBeDefined();
    });
  });

  describe("getProgrammes", () => {
    it("should be defined", async () => {
      expect(controller.getProgrammes).toBeDefined();
    });
  });

  describe("updateCourseSegmentStatus", () => {
    it("should be defined", async () => {
      expect(controller.updateCourseSegmentStatus).toBeDefined();
    });
  });

  describe("updateAssignmentStatus", () => {
    it("should be defined", async () => {
      expect(controller.updateAssignmentStatus).toBeDefined();
    });
  });

  describe("editCourseRun", () => {
    it("should be defined", async () => {
      expect(controller.editCourseRun).toBeDefined();
    });
  });

  describe("exportCourseSegment", () => {
    it("should be defined", async () => {
      expect(controller.exportCourseSegment).toBeDefined();
    });
  });

  describe("deleteCourseRun", () => {
    it("should be defined", async () => {
      expect(controller.deleteCourseRun).toBeDefined();
    });
  });

  describe("createNewCourse", () => {
    it("should be defined", async () => {
      expect(controller.createNewCourse).toBeDefined();
    });
  });
});
