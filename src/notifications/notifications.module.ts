import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { TrainerModule } from "src/trainer/trainer.module";
import { UserModule } from "src/user/user.module";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
  imports: [TrainerModule, UserModule],
})
export class NotificationsModule {}
