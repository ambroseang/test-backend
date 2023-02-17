import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ScheduleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public fiscalYear: string;

  @IsNotEmpty()
  @ApiProperty()
  public maxCourseRunsPerDay: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public blackoutPeriods: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public decreasedManpowerPeriods: string;
}
