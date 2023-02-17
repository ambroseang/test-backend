import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { ItemsOnHold } from "../../interfaces/scheduling_failures.interface";

export class AddItemsOnHoldDto {
  @IsNotEmpty()
  @ApiProperty()
  public approvedRuns: ItemsOnHold[];
}
