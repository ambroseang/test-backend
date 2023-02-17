import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class fyDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  public fy: string;
}
