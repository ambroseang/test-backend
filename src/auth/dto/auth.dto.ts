import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class AuthDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  user_name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;

  @IsOptional()
  @IsEnum(Role)
  @ApiProperty({
    enum: Role,
  })
  // Case Sensitive
  role: Role; // ADMIN or TRAINER
}
