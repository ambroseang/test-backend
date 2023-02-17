import { Injectable } from "@nestjs/common";
import { FiscalYear } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FiscalYearService {
  constructor(private prism: PrismaService) {}

  async patchFiscalYear(params: { where; data }): Promise<FiscalYear> {
    const { where, data } = params;
    return this.prism.fiscalYear.update({
      data: data,
      where: where,
    });
  }

  async getFiscalYear(params: { where }): Promise<FiscalYear> {
    const { where } = params;
    return this.prism.fiscalYear.findUnique({
      where: where,
    });
  }

  async getBlackoutDatesClashes(
    dates: Array<string>,
    blackoutDates: Map<string, Array<string>>,
  ): Promise<Map<string, Array<Date>>> {
    // convert array of string to set of date
    const dateSet = new Set(
      dates.map((date) => new Date(date).toISOString().split("T")[0]),
    );
    const clashes: Map<string, Array<Date>> = new Map<string, Array<Date>>();
    for (const key in blackoutDates) {
      for (const date of blackoutDates[key]) {
        const day = new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD format
        if (dateSet.has(day)) {
          if (clashes.has(key)) {
            clashes.get(key).push(date);
          } else {
            clashes.set(key, new Array(date));
          }
        }
      }
    }
    return clashes;
  }
}
