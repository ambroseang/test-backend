import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { PrismaModule } from "./prisma/prisma.module";
import { CourseModule } from "./course/course.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { DataIngestionModule } from "./data-ingestion/data-ingestion.module";
import { FiscalYearModule } from "./fiscal-year/fiscal-year.module";
import { TrainerModule } from "./trainer/trainer.module";
import { CalendarModule } from "./calendar/calendar.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { MailerModule } from "@nestjs-modules/mailer";
import { EjsAdapter } from "@nestjs-modules/mailer/dist/adapters/ejs.adapter";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    PrismaModule,
    CourseModule,
    SchedulerModule,
    DataIngestionModule,
    FiscalYearModule,
    TrainerModule,
    CalendarModule,
    NotificationsModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: configService.get<string>("SMTP_CONNECTION_STRING"),
        defaults: {
          from: '"nest-modules" <modules@nestjs.com>',
        },
        template: {
          dir: __dirname + "/templates",
          adapter: new EjsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
})
export class AppModule {}
