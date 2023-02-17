import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import {
  assignmentData,
  courseSegmentData,
  db,
  oneCourseSegment,
} from "../../../test/data";
import { TrainerService } from "../trainer.service";
import { CourseSegment } from "@prisma/client";

describe("TrainerService", () => {
  let service: TrainerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerService,
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<TrainerService>(TrainerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getTrainerClashes", () => {
    it("should be defined", async () => {
      const courseSegmentsOnSameDays: Map<string, CourseSegment[]> = new Map();
      courseSegmentsOnSameDays.set(new Date().toISOString(), courseSegmentData);
      const newTrainerList: Array<string> = ["Ash Ketchum"];
      const output = await service.getTrainerClashes(
        courseSegmentsOnSameDays,
        "2023-2024",
        oneCourseSegment.course_name,
        oneCourseSegment.segment,
        oneCourseSegment.run,
        newTrainerList,
      );
      const clashes: Map<string, Array<Date>> = new Map<string, Array<Date>>();
      clashes.set("Ash Ketchum", [new Date()]);
      expect(output).toBeInstanceOf(Map<string, Array<Date>>);
      expect(output.has("Ash Ketchum")).toBeTruthy();
      expect(output.get("Ash Ketchum")).toBeInstanceOf(Array<Date>);
    });
  });

  describe("getAssignmentsTrainersSegmentDatesOfFy", () => {
    it("should return an array of Trainers based FY", async () => {
      const param = {
        fy: "2023-2024",
      };
      const output = await service.getAssignmentsTrainersSegmentDatesOfFy(
        param.fy,
      );
      expect(output).toEqual(assignmentData);
    });
  });

  describe("getAssignmentTrainersByCourseSegments", () => {
    it("should return an array of Trainers based on assignments and course segment", async () => {
      const param = {
        fy: "2023-2024",
        course_name: "Python 101",
        segment: 1,
        run: 1,
      };
      const output = await service.getAssignmentTrainersByCourseSegments(
        param.fy,
        param.course_name,
        param.segment,
        param.run,
      );
      expect(output).toEqual(assignmentData);
    });
  });
});
