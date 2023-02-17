import { Test, TestingModule } from "@nestjs/testing";
import { FiscalYearService } from "../fiscal-year.service";
import { oneFiscalYear, db } from "../../../test/data";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

describe("FiscalYearService", () => {
  let service: FiscalYearService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalYearService,
        ConfigService,
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<FiscalYearService>(FiscalYearService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getFiscalYear", () => {
    it("should return one fiscal year information", async () => {
      const fiscalYear = await service.getFiscalYear({
        where: { fy: "2022-2023" },
      });

      expect(fiscalYear).toEqual(oneFiscalYear);
    });
  });

  describe("getBlackoutDatesClashes w/o clash", () => {
    it("should return empty clash map", async () => {
      const blackoutDates: Map<string, Array<string>> = new Map();
      blackoutDates.set("Vesak Day", new Array("2022-05-16T00:00:00.000Z"));
      const blackoutClash = await service.getBlackoutDatesClashes(
        ["2022-05-27T00:00:00.000Z"],
        JSON.parse(JSON.stringify(Object.fromEntries(blackoutDates))),
      );

      expect(blackoutClash).toEqual(new Map());
    });
  });

  describe("getBlackoutDatesClashes WITH clash", () => {
    it("should return clashed dates", async () => {
      const blackoutDates: Map<string, Array<string>> = new Map();
      blackoutDates.set("Vesak Day", new Array("2022-05-16T00:00:00.000Z"));
      const blackoutClash = await service.getBlackoutDatesClashes(
        ["2022-05-16T00:00:00.000Z"],
        JSON.parse(JSON.stringify(Object.fromEntries(blackoutDates))),
      );

      expect(blackoutClash).toEqual(blackoutDates);
    });
  });
});
