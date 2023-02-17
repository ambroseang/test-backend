import { IsNumber, IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CourseRunDto {
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
