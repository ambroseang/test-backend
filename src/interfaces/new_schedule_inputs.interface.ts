export interface BlackoutDates {
  [key: string]: Date[];
}

export interface LowManpowerDates {
  [key: string]: LowManpowerDate;
}

export interface LowManpowerDate {
  day_limit: number;
  dates: Date[];
}
