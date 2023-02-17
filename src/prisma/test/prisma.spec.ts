import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { db } from "../../../test/data";
import { PrismaService } from "../../prisma/prisma.service";

describe("Prisma Service", () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it("Course Service should be defined", () => {
    expect(service).toBeDefined();
  });
});