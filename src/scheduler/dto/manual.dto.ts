import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ManualDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public fiscalYear: string;
}
