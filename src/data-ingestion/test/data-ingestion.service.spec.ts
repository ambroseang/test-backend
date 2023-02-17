import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/prisma/prisma.service";
import { db } from "../../../test/data";
import { DataIngestionService } from "../data-ingestion.service";

describe("DataIngestionService", () => {
  let service: DataIngestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataIngestionService,
        ConfigService,
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<DataIngestionService>(DataIngestionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(service.parseSchedulingExcel).toBeDefined();
    expect(service.parseManualAddExcel).toBeDefined();
    expect(service.extractRowObjects).toBeDefined();
    expect(service.mandatoryColsCheck).toBeDefined();
    expect(service.fiscalYearCheck).toBeDefined();
  });
});
