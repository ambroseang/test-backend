enum Role {
  pm = "PM",
  trainer = "TRAINER",
}

enum DeliveryMode {
  f2f = "F2F",
  online = "ONLINE",
}

enum Status {
  generated = "GENERATED",
  reviewed = "REVIEWED",
  pending = "PENDING",
  accepted = "ACCEPTED",
  declined = "DECLINED",
  confirmed = "CONFIRMED",
  cancelled = "CANCELLED",
}

export const fyData = [
  {
    fy: "2022-2023",
    revenue_target: "5000",
    day_limit: "5",
    blackout_dates: {},
    low_manpower_dates: {},
  },
  {
    fy: "2023-2024",
    revenue_target: "5000",
    day_limit: "5",
    blackout_dates: {
      "Vesak Day": ["2022-05-16"],
    },
    low_manpower_dates: {},
  },
];

export const oneFiscalYear = fyData[0];
export const oneBlackoutFiscalYear = fyData[1];

export const programmeData = [
  {
    programme_name: "Introduction to Python",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    programme_name: "Ruby Fundamentals",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const oneProgramme = programmeData[0];

export const courseData = [
  {
    course_name: "Python 101",
    programme_name: "Introduction to Python",
    course_code: "111",
    delivery_mode: DeliveryMode.f2f,
    // revenue_target: 500000,
    createdAt: new Date(),
    updatedAt: new Date(),
    course_fees: 300.0,
    days: 3,
    trainers: ["Ash Ketchum"],
  },
  {
    course_name: "Python 122",
    programme_name: "Data Structure and Algorithm",
    course_code: "112",
    delivery_mode: DeliveryMode.f2f,
    // revenue_target: 500000,
    createdAt: new Date(),
    updatedAt: new Date(),
    course_fees: 500.0,
    days: 4,
    trainers: ["Ash Ketchum"],
  },
];

export const oneCourse = courseData[0];

export const newCourseData = [
  {
    programme_name: "Introduction to Python",
    course_name: "Python 101",
    fy: "2022-2023",
    course_code: "111",
    delivery_mode: DeliveryMode.f2f,
    days_per_run: 3,
    runs_per_year: 1,
    course_fees: 300.0,
    start_time: "09:00",
    end_time: "12:00",
    days_to_avoid: [1, 2, 3],
    avoid_month_start: true,
    avoid_month_end: true,
    trainers: [{ "Ash Ketchum": [1, 2] }],
  },
  {
    programme_name: "Data Structure and Algorithm",
    course_name: "Python 122",
    fy: "2022-2023",
    course_code: "212",
    delivery_mode: DeliveryMode.f2f,
    days_per_run: 2,
    runs_per_year: 1,
    course_fees: 500.0,
    start_time: "08:00",
    end_time: "11:00",
    days_to_avoid: [1, 2],
    avoid_month_start: true,
    avoid_month_end: true,
    trainers: [
      {
        "Ash Ketchum": [1, 2, 3, 4],
      },
    ],
  },
];

export const oneNewCourse = newCourseData[0];

export const courseConfigData = [
  {
    course_name: "Python 101",
    fy: "2023-2024",
    days_per_run: 3,
    runs_per_year: 4,
    course_fees: 300.0,
    start_time: new Date(),
    end_time: new Date(),
    days_to_avoid: [],
    avoid_month_start: false,
    avoid_month_end: false,
    split: [],
    trainers: {
      "Ash Ketchum": [1, 2, 3, 4],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    course_name: "Python 111",
    fy: "2023-2024",
    days_per_run: 4,
    runs_per_year: 4,
    course_fees: 500.0,
    start_time: new Date(),
    end_time: new Date(),
    days_to_avoid: [],
    avoid_month_start: false,
    avoid_month_end: false,
    split: [],
    trainers: {
      "Ash Ketchum": [1, 2, 3, 4],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const oneCourseConfig = courseConfigData[0];

export const courseRunData = [
  {
    run: 1,
    course_name: "Python 101",
    fy: "2023-2024",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    run: 2,
    course_name: "Python 101",
    fy: "2023-2024",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    run: 3,
    course_name: "Python 101",
    fy: "2023-2024",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const oneCourseRun = courseRunData[0];

export const courseSegmentData = [
  {
    segment: 1,
    course_name: "Python 101",
    fy: "2023-2024",
    run: 1,
    dates: [new Date("2023-04-03"), new Date("2023-04-05")],
    status: Status.generated,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    segment: 1,
    course_name: "Python 101",
    fy: "2023-2024",
    run: 2,
    dates: [new Date("2023-07-03"), new Date("2023-07-05")],
    status: Status.generated,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    segment: 1,
    course_name: "Python 101",
    fy: "2023-2024",
    run: 3,
    dates: [new Date("2023-10-02"), new Date("2023-10-04")],
    status: Status.generated,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const oneCourseSegment = courseSegmentData[0];

export const assignmentData = [
  {
    user_name: "Ash Ketchum",
    segment: 1,
    course_name: "Python 101",
    fy: "2023-2024",
    run: 1,
    assignment_status: Status.pending,
    decline_reason: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    user_name: "Ash Ketchum",
    segment: 1,
    course_name: "Python 101",
    fy: "2023-2024",
    run: 2,
    assignment_status: Status.pending,
    decline_reason: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    user_name: "Ash Ketchum",
    segment: 1,
    course_name: "Python 101",
    fy: "2023-2024",
    run: 3,
    assignment_status: Status.pending,
    decline_reason: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const oneAssignment = assignmentData[0];

export const userData = [
  {
    user_name: "Naruto Uzumaki",
    password: "naruto",
    email: "rafe.ang.2019@smu.edu.sg",
    role: Role.trainer,
  },
  {
    user_name: "Sasuke Momma",
    password: "sakura",
    email: "tsunade@hinata.hokage",
    role: Role.pm,
  },
];

export const oneUser = userData[0];
export const userTwo = userData[1];

export const db = {
  fiscalYear: {
    findMany: jest.fn().mockResolvedValue(fyData),
    findUnique: jest.fn().mockResolvedValue(oneFiscalYear),
    findFirst: jest.fn().mockResolvedValue(oneFiscalYear),
    create: jest.fn().mockReturnValue(oneFiscalYear),
    createMany: jest.fn().mockReturnValue([oneFiscalYear, fyData[0]]),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(oneFiscalYear),
    delete: jest.fn().mockResolvedValue(oneFiscalYear),
  },
  course: {
    findMany: jest.fn().mockResolvedValue(courseData),
    findUnique: jest.fn().mockResolvedValue(oneCourse),
    findFirst: jest.fn().mockResolvedValue(oneCourse),
    create: jest.fn().mockReturnValue(oneCourse),
    createMany: jest.fn().mockReturnValue([oneCourse, courseData[1]]),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(oneCourse),
    delete: jest.fn().mockResolvedValue(oneCourse),
    upsert: jest.fn().mockResolvedValue(oneCourse),
  },
  programme: {
    findMany: jest.fn().mockResolvedValue(programmeData),
    findUnique: jest.fn().mockResolvedValue(oneProgramme),
    findFirst: jest.fn().mockResolvedValue(oneProgramme),
    create: jest.fn().mockReturnValue(oneProgramme),
    createMany: jest.fn().mockReturnValue([oneProgramme, programmeData[1]]),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(oneProgramme),
    delete: jest.fn().mockResolvedValue(oneProgramme),
  },
  courseConfig: {
    findMany: jest.fn().mockResolvedValue(courseConfigData),
    findUnique: jest.fn().mockResolvedValue(oneCourseConfig),
    findFirst: jest.fn().mockResolvedValue(oneCourseConfig),
    create: jest.fn().mockReturnValue(oneCourseConfig),
    createMany: jest
      .fn()
      .mockReturnValue([oneCourseConfig, courseConfigData[1]]),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(oneCourseConfig),
    delete: jest.fn().mockResolvedValue(oneCourseConfig),
  },
  courseRun: {
    findMany: jest.fn().mockResolvedValue(courseRunData),
    findUnique: jest.fn().mockResolvedValue(oneCourseRun),
    findFirst: jest.fn().mockResolvedValue(oneCourseRun),
    create: jest.fn().mockReturnValue(oneCourseRun),
    createMany: jest.fn().mockReturnValue([oneCourseRun, courseRunData[1]]),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(oneCourseRun),
    delete: jest.fn().mockResolvedValue(oneCourseRun),
    count: jest.fn().mockResolvedValue(courseRunData),
  },
  courseSegment: {
    findMany: jest.fn().mockResolvedValue(courseSegmentData),
    findUnique: jest.fn().mockResolvedValue(oneCourseSegment),
    findFirst: jest.fn().mockResolvedValue(oneCourseSegment),
    create: jest.fn().mockReturnValue(oneCourseSegment),
    createMany: jest
      .fn()
      .mockReturnValue([oneCourseSegment, courseSegmentData[1]]),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(oneCourseSegment),
    delete: jest.fn().mockResolvedValue(oneCourseSegment),
    updateMany: jest.fn().mockResolvedValue(courseSegmentData),
  },
  assignment: {
    findMany: jest.fn().mockResolvedValue(assignmentData),
    findUnique: jest.fn().mockResolvedValue(oneAssignment),
    findFirst: jest.fn().mockResolvedValue(oneAssignment),
    create: jest.fn().mockReturnValue(oneAssignment),
    createMany: jest.fn().mockReturnValue([oneAssignment, assignmentData[1]]),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(oneAssignment),
    updateMany: jest.fn().mockResolvedValue(assignmentData),
    delete: jest.fn().mockResolvedValue(oneAssignment),
  },
  user: {
    findMany: jest.fn().mockResolvedValue(userData),
    findUnique: jest.fn().mockResolvedValue(oneUser),
    findFirst: jest.fn().mockResolvedValue(oneUser),
    create: jest.fn().mockReturnValue(oneUser),
    createMany: jest.fn().mockReturnValue([oneUser, userData[1]]),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(oneUser),
    delete: jest.fn().mockResolvedValue(oneUser),
  },
};
