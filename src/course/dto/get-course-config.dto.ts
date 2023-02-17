import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetCourseConfigDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  course_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  fy: string;
}
