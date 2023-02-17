import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DeliveryMode } from "@prisma/client";

export class CreateNewCourseDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public programme_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public course_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public fy: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public course_code: string;

  @IsNotEmpty()
  @IsEnum(DeliveryMode)
  @ApiProperty({
    enum: DeliveryMode,
  })
  delivery_mode: DeliveryMode;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  public days_per_run: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  public runs_per_year: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  public course_fees: number;

  @ApiProperty()
  public start_time: string;

  @ApiProperty()
  public end_time: string;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  public days_to_avoid: number[];

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  public avoid_month_start: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  public avoid_month_end: boolean;

  @IsNotEmpty()
  @ApiProperty()
  public trainers: any[];
}
