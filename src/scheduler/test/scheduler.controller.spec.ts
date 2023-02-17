import { HttpModule, HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { CalendarService } from "src/calendar/calendar.service";
import { CourseService } from "src/course/course.service";
import { DataIngestionService } from "src/data-ingestion/data-ingestion.service";
import { FiscalYearService } from "src/fiscal-year/fiscal-year.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { PrismaService } from "src/prisma/prisma.service";
import { TrainerService } from "src/trainer/trainer.service";
import { db } from "../../../test/data";
import { SchedulerController } from "../scheduler.controller";
import { SchedulerHelper } from "../scheduler.helper";
import { SchedulerService } from "../scheduler.service";

describe("Scheduler Controller", () => {
  let controller: SchedulerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulerController, ConfigService, HttpModule],
      providers: [
        SchedulerService,
        CourseService,
        ConfigService,
        FiscalYearService,
        SchedulerHelper,
        DataIngestionService,
        TrainerService,
        CalendarService,
        {
          provide: PrismaService,
          useValue: db,
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyTrainersBySegments: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<SchedulerController>(SchedulerController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("scheduleNew", () => {
    it("should be defined", async () => {
      expect(controller.scheduleNew).toBeDefined();
    });
  });

  describe("getPublicHolidays", () => {
    it("should be defined", async () => {
      expect(controller.getPublicHolidays).toBeDefined();
    });
  });

  describe("getTrainerFilterOptions", () => {
    it("should be defined", async () => {
      expect(controller.getTrainerFilterOptions).toBeDefined();
    });
  });

  describe("getPMFilterOptions", () => {
    it("should be defined", async () => {
      expect(controller.getPMFilterOptions).toBeDefined();
    });
  });

  describe("getCalendarFilterResults", () => {
    it("should be defined", async () => {
      expect(controller.getCalendarFilterResults).toBeDefined();
    });
  });

  describe("getBlackoutDates", () => {
    it("should be defined", async () => {
      expect(controller.getBlackoutDates).toBeDefined();
    });
  });

  describe("getFilterResults", () => {
    it("should be defined", async () => {
      expect(controller.getFilterResults).toBeDefined();
    });
  });

  describe("manualAdd", () => {
    it("should be defined", async () => {
      expect(controller.manualAdd).toBeDefined();
    });
  });

  describe("approveWarnings", () => {
    it("should be defined", async () => {
      expect(controller.approveWarnings).toBeDefined();
    });
  });
});
