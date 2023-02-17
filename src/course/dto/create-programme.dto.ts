import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ProgrammeDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  programme_name: string;
}
