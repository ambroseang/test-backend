import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";

export class CreateFyDto {
  constructor(
    fy: string,
    // revenue_target: number,
    day_limit: number,
    blackout_dates: Prisma.JsonObject,
    low_manpower_dates: Prisma.JsonObject,
  ) {
    this.fy = fy;
    // this.revenue_target = revenue_target;
    this.day_limit = day_limit;
    this.blackout_dates = blackout_dates;
    this.low_manpower_dates = low_manpower_dates;
  }

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fy: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  revenue_target: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  day_limit: number;

  @IsOptional()
  @ApiProperty()
  blackout_dates: Prisma.JsonObject;

  @IsOptional()
  @ApiProperty()
  low_manpower_dates: Prisma.JsonObject;
}
