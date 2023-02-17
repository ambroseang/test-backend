import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { courseSegmentData, db } from "../../../test/data";
import { CalendarService } from "../calendar.service";

describe("CalendarService", () => {
  let service: CalendarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        ConfigService,
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCoursesOnDate", () => {
    it("return courses based on a date", async () => {
      const courseSegment = await service.getCoursesOnDate(
        new Date("2023-04-03"),
      );
      expect(courseSegment).toEqual(courseSegmentData);
    });
  });
});
