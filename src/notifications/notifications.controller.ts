import { Body, Controller, ParseArrayPipe, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GetCourseSegmentDto } from "src/course/dto/get-course-segment.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post("adhoc")
  adhocEmail(
    @Body(new ParseArrayPipe({ items: GetCourseSegmentDto, whitelist: true }))
    body: GetCourseSegmentDto[],
  ) {
    return this.notificationsService.sendAdhocEmail(body);
  }
}
