import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class trainerFilterDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public fy: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public trainerName: string;
}
