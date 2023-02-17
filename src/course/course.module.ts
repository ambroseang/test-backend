import { Module } from "@nestjs/common";
import { CourseService } from "./course.service";
import { CourseController } from "./course.controller";
import { FiscalYearModule } from "src/fiscal-year/fiscal-year.module";
import { TrainerModule } from "src/trainer/trainer.module";
import { NotificationsModule } from "src/notifications/notifications.module";

@Module({
  imports: [FiscalYearModule, TrainerModule, NotificationsModule],
  providers: [CourseService],
  controllers: [CourseController],
  exports: [CourseService],
})
export class CourseModule {}
