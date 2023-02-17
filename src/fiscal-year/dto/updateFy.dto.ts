import { PartialType } from "@nestjs/swagger";
import { CreateFyDto } from "./createFy.dto";
// PartialType: Can have all the properties of CreateFyDto
export class UpdateFyDto extends PartialType(CreateFyDto) {
  constructor({
    fy = "",
    day_limit = 0,
    blackout_dates = null,
    low_manpower_dates = null,
  }) {
    super(fy, day_limit, blackout_dates, low_manpower_dates);
  }
}
