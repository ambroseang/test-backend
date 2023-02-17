import { Injectable } from "@nestjs/common";
import { CourseSegment } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TrainerService {
  constructor(private prisma: PrismaService) {}

  async getTrainerClashes(
    courseSegmentsOnSameDays: Map<string, CourseSegment[]>,
    fy: string,
    courseName: string,
    segment: number,
    run: number,
    newTrainerList: Array<string>,
  ): Promise<Map<string, Array<Date>>> {
    const clashes: Map<string, Array<Date>> = new Map<string, Array<Date>>();
    // const trainers = await this.getAssignmentTrainersByCourseSegments(
    //   fy,
    //   courseName,
    //   segment,
    //   run,
    // );
    // const trainerSet = new Set(trainers.map((trainer) => trainer.user_name));
    const trainerSet = new Set(newTrainerList);
    for (const [date, courseSegments] of courseSegmentsOnSameDays.entries()) {
      for (const courseSegment of courseSegments) {
        const trainerArr = await this.getAssignmentTrainersByCourseSegments(
          fy,
          courseSegment.course_name,
          courseSegment.segment,
          courseSegment.run,
        );
        for (const trainer of trainerArr) {
          if (trainerSet.has(trainer.user_name)) {
            if (clashes.has(trainer.user_name)) {
              clashes.get(trainer.user_name).push(new Date(date));
            } else {
              clashes.set(trainer.user_name, [new Date(date)]);
            }
          }
        }
      }
    }
    return clashes;
  }

  async getAssignmentsTrainersSegmentDatesOfFy(fy: string) {
    return this.prisma.assignment.findMany({
      where: {
        fy: fy,
      },
      select: {
        user_name: true,
        CourseSegment: {
          select: {
            dates: true,
          },
        },
      },
    });
  }

  async getAssignmentTrainersByCourseSegments(
    fy: string,
    course_name: string,
    segment: number,
    run: number,
  ) {
    const resp = await this.prisma.assignment.findMany({
      where: {
        fy: fy,
        course_name: course_name,
        segment: segment,
        run: run,
      },
      select: {
        user_name: true,
      },
    });
    return resp;
  }
}
