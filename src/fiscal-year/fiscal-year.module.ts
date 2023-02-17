import { Module } from "@nestjs/common";
import { FiscalYearService } from "./fiscal-year.service";

@Module({
  providers: [FiscalYearService],
  exports: [FiscalYearService],
})
export class FiscalYearModule {}
