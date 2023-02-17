export interface Weeks {
  [key: number]: (number | null)[];
}

export interface Month {
  weeks: Weeks;
}

export interface Year {
  [key: number]: Month;
}

export interface Calendar {
  [key: number]: Year;
}
