import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetProgrammeDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  programme_name: string;
}
