import { IsString, IsNotEmpty, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DeliveryMode } from "@prisma/client";

export class CourseDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  course_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  programme_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  course_code: string;

  @IsNotEmpty()
  @IsEnum(DeliveryMode)
  @ApiProperty({
    enum: DeliveryMode,
  })
  delivery_mode: DeliveryMode;
}
