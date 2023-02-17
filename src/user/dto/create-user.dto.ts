import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  user_name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  // https://github.com/typestack/class-validator
  // can be updated to provide password restrictions
  // e.g. password length
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
