import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  user_name: string;
}
