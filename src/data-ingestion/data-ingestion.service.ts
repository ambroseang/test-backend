import { Injectable } from "@nestjs/common";
import { CellValue, Workbook, Worksheet } from "exceljs";
import * as fieldMapping from "./excel_to_db_field_mapping.json";

@Injectable()
export class DataIngestionService {
  async parseSchedulingExcel(
    file: Express.Multer.File,
    fiscalYear: string,
  ): Promise<
    [
      Array<Map<string, CellValue>>,
      Map<number, string>,
      Array<Map<string, CellValue>>,
      Map<number, string>,
    ]
  > {
    const workBook = new Workbook();

    const [
      courseInfoRowObjects,
      courseInfoValidationObjects,
      manualAdditionRowObjects,
      manualValidationObjects,
    ] = await workBook.xlsx.load(file.buffer).then(() => {
      const courseInfoSheet: Worksheet =
        workBook.getWorksheet("Course Information");
      const manualAdditionSheet: Worksheet =
        workBook.getWorksheet("Manual Addition");

      const [courseInfoRowObjs, courseInfoValidationObjs] =
        this.extractRowObjects(courseInfoSheet);
      const [manualAdditionRowObjs, manualValidationObjs] =
        this.extractRowObjects(manualAdditionSheet, fiscalYear);
      return [
        courseInfoRowObjs,
        courseInfoValidationObjs,
        manualAdditionRowObjs,
        manualValidationObjs,
      ];
    });

    return [
      courseInfoRowObjects,
      courseInfoValidationObjects,
      manualAdditionRowObjects,
      manualValidationObjects,
    ];
  }

  async parseManualAddExcel(
    file: Express.Multer.File,
    fy: string,
  ): Promise<[Map<string, CellValue>[], Map<number, string>]> {
    const workBook = new Workbook();
    const manualAdditionRowObjects = await workBook.xlsx
      .load(file.buffer)
      .then(() => {
        const manualAdditionSheet: Worksheet =
          workBook.getWorksheet("Manual Addition");
        const manualAdditionRowObjs = this.extractRowObjects(
          manualAdditionSheet,
          fy,
        );
        return manualAdditionRowObjs;
      });
    return manualAdditionRowObjects;
  }

  extractRowObjects(sheet: Worksheet, fiscalYear = ""): any {
    const headerMap: Map<number, any> = new Map();
    const rowObjs: Array<Map<string, CellValue>> = [];
    let isCourseInfo = false;
    const rowValidation: Map<number, string> = new Map<number, string>();

    sheet.eachRow((row, rowNumber) => {
      const filledCols: Set<number> = new Set<number>();
      if (rowNumber === 1) {
        row.eachCell((cell, cellNum) => {
          headerMap.set(cellNum, cell.value);

          if (cell.value == "Programme") {
            isCourseInfo = true;
          }
        });
      } else {
        const rowObj: Map<string, CellValue> = new Map();
        row.eachCell((cell, cellNum) => {
          const headerField: any = headerMap.get(cellNum);
          if (headerField in fieldMapping) {
            let cellValue: CellValue = cell.value;

            // CLEANING INPUT: Removing trailing and leading whitespaces from input strings
            if (typeof cellValue === "string") {
              cellValue = cellValue.trim();
            }
            // VALIDATION: checking if inputted dates are within the FY
            if (
              (headerField == "Start Date" || headerField == "Dates") &&
              this.fiscalYearCheck(cellValue, fiscalYear)
            ) {
              rowValidation.set(
                rowNumber,
                "All or some of the dates provided are out of the fiscal year.",
              );
            }

            rowObj.set(fieldMapping[headerField], cellValue);
            filledCols.add(cellNum);
          }
        });

        // CLEANING INPUT: checking if when PM does not fill in programme name
        if (isCourseInfo && rowObj.get(fieldMapping.Programme) == undefined) {
          rowObj.set(
            fieldMapping.Programme,
            rowObj.get(fieldMapping["Course Title"]),
          );
        }

        // VALIDATION: checking for missing mandatory fields
        const validationMsg: string = this.mandatoryColsCheck(
          isCourseInfo,
          filledCols,
        );
        if (validationMsg != "") {
          if (rowValidation.get(rowNumber) == undefined) {
            rowValidation.set(rowNumber, validationMsg);
          } else {
            const existingValidation: string = rowValidation.get(rowNumber);
            rowValidation.set(
              rowNumber,
              existingValidation + " " + validationMsg,
            );
          }
        }
        rowObjs.push(rowObj);
      }
    });
    return [rowObjs, rowValidation];
  }

  mandatoryColsCheck(isCourseInfo: boolean, filledCols: Set<number>): string {
    const mandatoryCols: Array<number> = isCourseInfo
      ? [2, 3, 4, 5, 6, 9, 10, 11]
      : [1];
    const missingCellsArr: Array<number> = [];

    mandatoryCols.forEach((mandatoryCol) => {
      if (!filledCols.has(mandatoryCol)) {
        missingCellsArr.push(mandatoryCol);
      }
    });

    if (missingCellsArr.length != 0) {
      return `Column(s) ${missingCellsArr.join(", ")} must be filled up.`;
    }

    return "";
  }

  fiscalYearCheck(cellValue: CellValue, fiscalYear: string): boolean {
    const inputYears: Array<string> = cellValue.toString().split(",");
    const fiscalYearArr: Array<string> = fiscalYear.split("-");
    const fiscalYearStartDate: Date = new Date(`${fiscalYearArr[0]}-04-01`);
    const fiscalYearEndDate: Date = new Date(`${fiscalYearArr[1]}-03-31`);

    for (let i = 0; i < inputYears.length; i++) {
      const dateToCheck: Date = new Date(inputYears[i]);
      if (
        dateToCheck < fiscalYearStartDate ||
        dateToCheck > fiscalYearEndDate
      ) {
        return true;
      }
    }

    return false;
  }
}
