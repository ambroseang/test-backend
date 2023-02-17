import { Module } from "@nestjs/common";
import { SchedulerService } from "./scheduler.service";
import { SchedulerController } from "./scheduler.controller";
import { DataIngestionModule } from "../data-ingestion/data-ingestion.module";
import { CourseModule } from "src/course/course.module";
import { FiscalYearModule } from "src/fiscal-year/fiscal-year.module";
import { HttpModule } from "@nestjs/axios";
import { SchedulerHelper } from "./scheduler.helper";
import { TrainerModule } from "src/trainer/trainer.module";
import { CalendarModule } from "src/calendar/calendar.module";

@Module({
  imports: [
    DataIngestionModule,
    CourseModule,
    FiscalYearModule,
    HttpModule,
    TrainerModule,
    CalendarModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, SchedulerHelper],
})
export class SchedulerModule {}
