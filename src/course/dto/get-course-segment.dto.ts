import { IsNumber, IsString, IsNotEmpty, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetCourseSegmentDto {
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
}
