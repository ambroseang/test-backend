import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsArray, IsBoolean, IsEnum, IsNotEmpty } from "class-validator";
import { CreateCourseSegmentDto } from "./create-course-segment.dto";

export class EditCourseSegmentDto extends PartialType(CreateCourseSegmentDto) {
  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  public bypass: number;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  public newTrainerList: Array<string>;

  @IsEnum(Status)
  @IsNotEmpty()
  @ApiProperty()
  public status: Status;
}
