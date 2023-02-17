import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  // course: any;
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  cleanDb() {
    return this.$transaction([
      this.fiscalYear.deleteMany(),
      this.programme.deleteMany(),
      this.course.deleteMany(),
      this.courseConfig.deleteMany(),
      this.courseRun.deleteMany(),
      this.courseSegment.deleteMany(),
      this.user.deleteMany(),
      this.assignment.deleteMany(),
      this.notification.deleteMany(),
    ]);
  }
}
