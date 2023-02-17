import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class HolidayDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public startYear: string;
}
