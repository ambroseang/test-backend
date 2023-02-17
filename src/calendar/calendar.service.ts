import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getCoursesOnDate(date: Date) {
    return this.prisma.courseSegment.findMany({
      where: {
        dates: {
          has: date,
        },
      },
    });
  }
}
