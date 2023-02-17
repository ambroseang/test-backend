import { HttpModule } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { CourseConfig } from "@prisma/client";
import { CalendarService } from "src/calendar/calendar.service";
import { CourseService } from "src/course/course.service";
import { DataIngestionService } from "src/data-ingestion/data-ingestion.service";
import { FiscalYearService } from "src/fiscal-year/fiscal-year.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { PrismaService } from "src/prisma/prisma.service";
import { TrainerService } from "src/trainer/trainer.service";
import { courseConfigData, db } from "../../../test/data";
import { fyDto } from "../dto";
import { SchedulerHelper } from "../scheduler.helper";
import { SchedulerService } from "../scheduler.service";

describe("SchedulerService", () => {
  let service: SchedulerService;
  let helper: SchedulerHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigService, HttpModule],
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
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    helper = module.get<SchedulerHelper>(SchedulerHelper);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(service.scheduleNew).toBeDefined();
    expect(service.manualAdd).toBeDefined();
    expect(service.confirmItemsOnHold).toBeDefined();
    expect(service.createErrorWorkbook).toBeDefined();
    expect(service.getPublicHolidays).toBeDefined();
    expect(service.getTrainerFilterOptions).toBeDefined();
    expect(service.getPMFilterOptions).toBeDefined();
    expect(service.getFilterResults).toBeDefined();
    expect(service.getBlackoutDates).toBeDefined();
  });

  it("helper methods to be defined", async () => {
    expect(helper.splitCoursesByPriority).toBeDefined();
    const input: CourseConfig[] = courseConfigData;
    const output: CourseConfig[][] = await helper.splitCoursesByPriority(input);
    expect(output).toEqual([[], courseConfigData]);
  });

  describe("getBlackoutDate", () => {
    it("return the blackoutdates", async () => {
      const input: fyDto = { fy: "2023-2024" };
      const output = await service.getBlackoutDates(input);
      expect(output).toEqual([]);
    });
  });

  // describe('Trainer Filter Options', () => {
  //   let tfDto = new trainerFilterDto();
  //   tfDto.fy = '2023-2024';
  //   tfDto.trainerName = 'Ash Ketchum'

  //   it('should return the correct filter options', async () => {

  //     const filterOptions = await service.getTrainerFilterOptions(tfDto);
  //     const expectedResults = {
  //       "programmes": [
  //           "Split"
  //       ],
  //       "courses": [
  //           "Split: Trainers"
  //       ],
  //       "status": [
  //           "PENDING",
  //           "ACCEPTED",
  //           "DECLINED",
  //           "CONFIRMED",
  //           "CANCELLED"
  //       ],
  //       "mode of delivery": [
  //           "F2F",
  //           "ONLINE"
  //       ]
  //   }
  //     expect(filterOptions).toEqual(expectedResults);
  //   });
  // });

  // describe("getPublicHolidays", () => {
  //   it("return a list of public holidays", async () => {
  //     const currentYear = String(new Date().getFullYear());
  //     const year: HolidayDto = {
  //       startYear: currentYear,
  //     };
  //     const holidays = await service.getPublicHolidays(year);
  //     const expected = {
  //       "Christmas Eve": new Date(currentYear + "-12-24").toISOString(),
  //     };

  //     try {
  //       expect(holidays).toMatchObject(expected);
  //     } catch (e) {
  //       const next_expected = {
  //         "Christmas Eve": new Date(currentYear + "-12-25").toISOString(),
  //       };
  //       expect(holidays).toMatchObject(next_expected);
  //     }
  //   });
  // });
});
