import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { SchedulerService } from "./scheduler.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  ScheduleDto,
  HolidayDto,
  FilterDto,
  fyDto,
  ManualDto,
  trainerFilterDto,
} from "./dto";
import { Response } from "express";
import { AddItemsOnHoldDto } from "./dto/add-items-on-hold.dto";
import { JwtGuard } from "../auth/guard";

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller("scheduler")
@ApiTags("Scheduler")
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post("new")
  @UseInterceptors(FileInterceptor("file"))
  async scheduleNew(
    @Res() res: Response,
    @Body() body: ScheduleDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const path = require("path");
    const validExtName = /xls|xlsx/.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (validExtName) {
      this.schedulerService.scheduleNew(file, body).then(async (response) => {
        if ("courseInfoValidationObjects" in response) {
          const workbook = this.schedulerService.createErrorWorkbook(
            file,
            response.courseInfoValidationObjects,
            response.manualValidationObjects,
          );

          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          );
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "input_errors.xlsx",
          );
          await (await workbook).xlsx.write(res);
          res.status(201).end();
        } else {
          res.status(200).send(response);
        }
      });
    } else {
      return res.status(400).send({ message: "Invalid file format, " });
    }
  }

  @Post("holidays")
  getPublicHolidays(@Body() body: HolidayDto) {
    return this.schedulerService.getPublicHolidays(body);
  }

  @Post("/filterOptions/trainer")
  getTrainerFilterOptions(@Body() body: trainerFilterDto) {
    return this.schedulerService.getTrainerFilterOptions(body);
  }

  @Post("/filterOptions/pm")
  getPMFilterOptions(@Body() body: fyDto) {
    return this.schedulerService.getPMFilterOptions(body);
  }

  @Post("/calendar/filter")
  async getCalendarFilterResults(@Body() dto: FilterDto) {
    const filterResults = await this.schedulerService.getFilterResults(dto);
    return this.schedulerService.formatCalendarResults(filterResults);
  }

  @Post("/calendar/blackoutdates")
  async getBlackoutDates(@Body() body: fyDto) {
    return this.schedulerService.getBlackoutDates(body);
  }

  @Post("/filter")
  getFilterResults(@Body() dto: FilterDto) {
    return this.schedulerService.getFilterResults(dto);
  }

  @Post("/manualAddition")
  @UseInterceptors(FileInterceptor("file"))
  manualAdd(
    @Body() body: ManualDto,
    @UploadedFile() file: Express.Multer.File,
  ): any {
    return this.schedulerService.manualAdd(file, body);
  }

  @Post("/approveWarnings")
  async approveWarnings(@Res() res: Response, @Body() dto: AddItemsOnHoldDto) {
    const response = await this.schedulerService.confirmItemsOnHold(dto);
    if (response.errors.length === 0) {
      res.status(200).send("Successfully created items on hold");
    } else {
      res.status(500).send(response);
    }
  }
}

// //overall mapping
// {
//   "Programme": "programme_name",
//   "Course Title": "course_name"
// }

// //per row object
// {
//   "Programme": "Graduate Certificate...",

// }

// // programme entity fields
// ["Programme"]
// ["Course Title", "Course Code", "Programme", "Mode of Delivery"]
// // db entity
// {

// }
