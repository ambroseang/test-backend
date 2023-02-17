import {
  Body,
  Controller,
  Delete,
  Get,
  ParseArrayPipe,
  Patch,
  Post,
  Put,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { FilterDto, fyDto } from "src/scheduler/dto";
import { CourseService } from "./course.service";
import {
  CourseRunDto,
  CreateNewCourseDto,
  GetProgrammeDto,
  GetCourseConfigDto,
  UpdateCourseSegmentDto,
  EditCourseSegmentDto,
  CourseFilterDto,
} from "./dto";
import { JwtGuard } from "../auth/guard";
import { Response } from "express";
import { AssignmentDto } from "./dto/get-assignment.dto";

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller("course")
@ApiTags("Course & Programmes")
export class CourseController {
  constructor(private courseService: CourseService) {}

  @Post()
  getCourses(@Body() body: fyDto) {
    return this.courseService.getCourses(body);
  }

  @Post("filter")
  filterCourses(@Body() body: CourseFilterDto) {
    return this.courseService.filterCourses(body);
  }

  @Post("details")
  getCourseDetails(@Body() body: GetCourseConfigDto) {
    return this.courseService.getCourseDetails(body);
  }

  @Delete()
  deleteCourse(@Body() body: GetCourseConfigDto) {
    return this.courseService.removeCourse(body);
  }

  @Get("programmes")
  getProgrammes() {
    return this.courseService.getProgrammes();
  }

  @Post("programme")
  getProgramme(@Body() body: GetProgrammeDto) {
    return this.courseService.getProgramme(body);
  }

  @Put("segment/status")
  updateCourseSegmentStatus(
    @Body(
      new ParseArrayPipe({ items: UpdateCourseSegmentDto, whitelist: true }),
    )
    body: UpdateCourseSegmentDto[],
  ) {
    return this.courseService.updateCourseSegmentStatus(body);
  }

  @Put("assignment/status")
  updateAssignmentStatus(
    @Body(new ParseArrayPipe({ items: AssignmentDto, whitelist: true }))
    body: AssignmentDto[],
  ) {
    return this.courseService.updateAssignmentStatus(body);
  }

  @Patch("run")
  editCourseRun(@Body() body: EditCourseSegmentDto) {
    return this.courseService.editScheduledCourseRun(body);
  }

  @Post("segment/export")
  async exportCourseSegment(@Res() res: Response, @Body() dto: FilterDto) {
    try {
      const courseSegments = await this.courseService.exportCourseSegment(dto);
      const workbook =
        this.courseService.exportCourseSegmentToExcel(courseSegments);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "coursesegments.xlsx",
      );
      return workbook.xlsx.write(res).then(function () {
        res.status(200).end();
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @Delete("run/delete")
  deleteCourseRun(@Body() body: CourseRunDto) {
    return this.courseService.removeScheduledCourseRun(body);
  }

  @Post("new")
  createNewCourse(@Body() body: CreateNewCourseDto) {
    return this.courseService.createNewCourse(body);
  }
}
