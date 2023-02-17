import { ApiProperty } from "@nestjs/swagger";
import { DeliveryMode } from "@prisma/client";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class CourseFilterDto {
  @IsString()
  @ApiProperty()
  fy: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  programme_name: Array<string>;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  course_name: Array<string>;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  // Case Sensitive
  delivery_mode: Array<DeliveryMode>; // F2F || ONLINE

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  trainers: Array<string>;
}
