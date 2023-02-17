import { IsNumber, IsString, IsNotEmpty, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";

export class UpdateCourseSegmentDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  public segment: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  public run: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public course_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public fy: string;

  @IsNotEmpty()
  @IsEnum(Status)
  @ApiProperty({
    enum: Status,
  })
  public new_status: Status;
}
