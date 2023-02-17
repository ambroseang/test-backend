import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateCourseSegmentDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  public segment: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public course_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public fy: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  public run: number;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  public dates: Array<string>;
}
