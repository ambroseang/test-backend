import {
  Assignment,
  CourseConfig,
  CourseRun,
  CourseSegment,
} from "@prisma/client";

export interface SchedulingIssue {
  config?: CourseConfig;
  reasons: string[];
  itemsOnHold?: ItemsOnHold;
}

export interface ItemsOnHold {
  courseRun: CourseRun;
  courseSegments: CourseSegment[];
  assignments: Assignment[];
}
