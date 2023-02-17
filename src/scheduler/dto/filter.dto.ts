import { ApiProperty } from "@nestjs/swagger";
import { DeliveryMode, Status } from "@prisma/client";
import { IsArray, IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class FilterDto {
  @IsString()
  @ApiProperty()
  fy: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  programme_name: Array<string>;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  course_name: Array<string>;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  // Case Sensitive
  delivery_mode: Array<DeliveryMode>; // F2F || ONLINE

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  // Case Sensitive
  status: Array<Status>; // GENERATED || REVIEWED || PENDING || ACCEPTED || DECLINED || CONFIRMED || CANCELLED

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  trainers: Array<string>;

  @IsBoolean()
  @ApiProperty()
  export_by_trainer = false;
}
