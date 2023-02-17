import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetCourseDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  course_name: string;
}
