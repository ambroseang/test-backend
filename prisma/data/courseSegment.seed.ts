enum Status {
  generated = 'GENERATED',
  reviewed = 'REVIEWED',
  pending = 'PENDING',
  accepted = 'ACCEPTED',
  declined = 'DECLINED',
  confirmed = 'CONFIRMED',
  cancelled = 'CANCELLED',
}

export const courseSegment_seed = [
  {
    segment: 1,
    course_name: 'Python 101',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2023-04-03'),
      new Date('2023-04-05'),
    ],
  },
  {
    segment: 1,
    course_name: 'Python 101',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-05'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Python 101',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-10-02'),
      new Date('2023-10-04'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Python 101',
    fy: '2023-2024',
    run: 4,
    dates: [
      new Date('2024-01-02'),
      new Date('2024-01-04'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Python 111',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2023-04-10'),
      new Date('2023-04-13'),
    ],
  },
  {
    segment: 1,
    course_name: 'Python 111',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-07-10'),
      new Date('2023-07-13'),
    ],
  },
  {
    segment: 1,
    course_name: 'Python 111',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-10-09'),
      new Date('2023-10-12'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Python 111',
    fy: '2023-2024',
    run: 4,
    dates: [
      new Date('2024-01-08'),
      new Date('2024-01-11'),
    ],
    status: Status.declined,
  },
  {
    segment: 1,
    course_name: 'Python 122: For the Experts',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2023-04-17'),
      new Date('2023-04-21'),
    ],
  },
  {
    segment: 1,
    course_name: 'Python 122: For the Experts',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-07-17'),
      new Date('2023-07-21'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Python 122: For the Experts',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-10-16'),
      new Date('2023-10-20'),
    ],
  },
  {
    segment: 1,
    course_name: 'Python 122: For the Experts',
    fy: '2023-2024',
    run: 4,
    dates: [
      new Date('2024-01-15'),
      new Date('2024-01-19'),
    ],
    status: Status.declined,
  },
  {
    run: 1,
    segment: 1,
    dates: [
      new Date('2023-04-01'),
      new Date('2023-04-02')
    ],
    course_name: 'Python 101:V2',
    fy: '2023-2024',
  },
  {
    run: 1,
    segment: 1,
    dates: [
      new Date('2023-04-03'),
      new Date('2023-04-04')
    ],
    course_name: 'Python 111:V2',
    fy: '2023-2024',
  },
  {
    run: 1,
    segment: 1,
    dates: [
      new Date('2023-04-05'),
      new Date('2023-04-06')
    ],
    course_name: 'Python 122: For the Experts:V2',
    fy: '2023-2024',
  },
  {
    run: 1,
    segment: 1,
    dates: [
      new Date('2023-04-07'),
      new Date('2023-04-08')
    ],
    course_name: 'Python 111:V3',
    fy: '2023-2024',
  },
  {
    run: 1,
    segment: 1,
    dates: [
      new Date('2023-04-09'),
      new Date('2023-04-10')
    ],
    course_name: 'Python 122: For the Experts:V3',
    fy: '2023-2024',
  },
  {
    run: 1,
    segment: 1,
    dates: [
      new Date('2023-04-11'),
      new Date('2023-04-12')
    ],
    course_name: 'Python 122: For the Experts:V4',
    fy: '2023-2024',
  },
  {
    segment: 1,
    course_name: 'Ruby Fundamentals',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-02'),
      new Date('2024-01-05'),
    ],
  },
  {
    segment: 1,
    course_name: 'Ruby Fundamentals',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-05'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Ruby Fundamentals',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-10-02'),
      new Date('2023-10-04'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Ruby Fundamentals',
    fy: '2023-2024',
    run: 4,
    dates: [
      new Date('2024-01-02'),
      new Date('2024-01-04'), 
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Ruby Intermediate',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-09'),
      new Date('2024-01-12'),
    ],
  },
  {
    segment: 1,
    course_name: 'Ruby Intermediate',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-04-01'),
      new Date('2023-04-04'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Ruby Intermediate',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-06'),
    ],
  },
  {
    segment: 1,
    course_name: 'Ruby Expert',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-16'),
      new Date('2024-01-20'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Ruby Expert',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-04-08'),
      new Date('2023-04-12'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Ruby Expert',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-07-10'),
      new Date('2023-07-14'),
    ],
    status: Status.declined,
  },
  {
    segment: 1,
    course_name: "Google's Language: GO Basic I",
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-02'),
      new Date('2024-01-03'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: "Google's Language: GO Basic I",
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-04'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: "Google's Language: GO Basic II",
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-04'),
      new Date('2024-01-06'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: "Google's Language: GO Basic II",
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-07-05'),
      new Date('2023-07-07'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Business Design I',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-02'),
      new Date('2024-01-04'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Business Design II',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-09'),
      new Date('2024-01-12'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Business Design III',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-16'),
      new Date('2024-01-23'),
    ],
    status: Status.accepted
  },
  {
    segment: 1,
    course_name: 'Business Design III',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2024-03-13'),
      new Date('2024-03-20'),
    ],
    status: Status.accepted
  },
  {
    segment: 1,
    course_name: 'Business Design III',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-04-03'),
      new Date('2023-04-10'),
    ],
    status: Status.accepted
  },
  {
    segment: 1,
    course_name: 'Business Design III',
    fy: '2023-2024',
    run: 4,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-10'),
    ],
    status: Status.accepted
  },
  {
    segment: 1,
    course_name: 'Business Design III',
    fy: '2023-2024',
    run: 5,
    dates: [
      new Date('2023-07-17'),
      new Date('2023-07-24'),
    ],
    status: Status.accepted
  },
  {
    segment: 1,
    course_name: 'Business Design III',
    fy: '2023-2024',
    run: 6,
    dates: [
      new Date('2023-07-24'),
      new Date('2023-07-31'),
    ],
    status: Status.accepted
  },
  {
    segment: 1,
    course_name: 'Business Design IV',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-30'),
      new Date('2024-02-08'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Business Design IV',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-04-03'),
      new Date('2023-04-12'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Business Design IV',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-12'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Business Design V',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-09'),
      new Date('2024-01-20'),
    ],
    status: Status.declined,
  },
  {
    segment: 1,
    course_name: 'Business Design V',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2024-02-13'),
      new Date('2024-02-24'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Business Design V',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-14'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Business Design V',
    fy: '2023-2024',
    run: 4,
    dates: [
      new Date('2023-07-10'),
      new Date('2023-07-21'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Business Design V',
    fy: '2023-2024',
    run: 5,
    dates: [
      new Date('2023-07-17'),
      new Date('2023-07-28'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Business Design V',
    fy: '2023-2024',
    run: 6,
    dates: [
      new Date('2023-07-24'),
      new Date('2023-08-04'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Procrastination 1: Basic',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-06'),
      new Date('2024-01-06'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Procrastination 1: Basic',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-06-02'),
      new Date('2023-06-02'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Procrastination 1: Basic',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-07-02'),
      new Date('2023-07-02'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Procrastination 1: Intermediate',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2024-01-13'),
      new Date('2024-01-20'),
    ],
    status: Status.declined,
  },
  {
    segment: 1,
    course_name: 'Procrastination 1: Intermediate',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-06-09'),
      new Date('2023-06-16'),
    ],
  },
  {
    segment: 1,
    course_name: 'Procrastination 1: Intermediate',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-07-13'),
      new Date('2023-07-20'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2023-04-24'),
      new Date('2023-04-24'),
    ],
    status: Status.cancelled,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-06-01'),
      new Date('2023-06-01'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-08-01'),
      new Date('2023-08-01'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 4,
    dates: [
      new Date('2023-10-02'),
      new Date('2023-10-02'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 5,
    dates: [
      new Date('2023-12-01'),
      new Date('2023-12-01'),
    ],
    status: Status.cancelled,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 6,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-04'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 7,
    dates: [
      new Date('2023-07-05'),
      new Date('2023-07-06'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 8,
    dates: [
      new Date('2023-07-06'),
      new Date('2023-07-07'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 9,
    dates: [
      new Date('2023-07-24'),
      new Date('2023-07-25'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 10,
    dates: [
      new Date('2023-07-25'),
      new Date('2023-07-26'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 11,
    dates: [
      new Date('2023-07-27'),
      new Date('2023-07-28'),
    ],
    status: Status.cancelled,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 12,
    dates: [
      new Date('2024-01-02'),
      new Date('2024-01-02'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Leading the audience I',
    fy: '2023-2024',
    run: 13,
    dates: [
      new Date('2024-03-25'),
      new Date('2024-03-26'),
    ],
    status: Status.cancelled,
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2023-04-03'),
      new Date('2023-04-04'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-05-02'),
      new Date('2023-05-03'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-06-05'),
      new Date('2023-06-06'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 4,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-04'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 5,
    dates: [
      new Date('2023-08-02'),
      new Date('2023-08-03'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 6,
    dates: [
      new Date('2023-09-04'),
      new Date('2023-09-05'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 7,
    dates: [
      new Date('2023-10-03'),
      new Date('2023-10-04'),
    ],
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 8,
    dates: [
      new Date('2023-11-02'),
      new Date('2023-11-03'),
    ],
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 9,
    dates: [
      new Date('2023-12-04'),
      new Date('2023-12-05'),
    ],
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 10,
    dates: [
      new Date('2024-01-03'),
      new Date('2024-01-04'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 11,
    dates: [
      new Date('2024-02-05'),
      new Date('2024-02-06'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience II',
    fy: '2023-2024',
    run: 12,
    dates: [
      new Date('2024-03-04'),
      new Date('2024-03-05'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2023-04-05'),
      new Date('2023-04-06'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 2,
    dates: [
      new Date('2023-04-12'),
      new Date('2023-04-13'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 3,
    dates: [
      new Date('2023-05-03'),
      new Date('2023-05-04'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 4,
    dates: [
      new Date('2023-05-10'),
      new Date('2023-05-11'),
    ],
    status: Status.declined,
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 5,
    dates: [
      new Date('2023-06-03'),
      new Date('2023-06-04'),
    ],
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 6,
    dates: [
      new Date('2023-07-03'),
      new Date('2023-07-04'),
    ],
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 7,
    dates: [
      new Date('2023-08-03'),
      new Date('2023-08-04'),
    ],
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 8,
    dates: [
      new Date('2023-09-06'),
      new Date('2023-09-07'),
    ],
    status: Status.pending,
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 9,
    dates: [
      new Date('2023-10-04'),
      new Date('2023-10-05'),
    ],
    status: Status.reviewed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 10,
    dates: [
      new Date('2023-11-09'),
      new Date('2023-11-16'),
    ],
    status: Status.accepted,
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 11,
    dates: [
      new Date('2023-12-09'),
      new Date('2023-12-16'),
    ],
    status: Status.confirmed,
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 12,
    dates: [
      new Date('2024-01-04'),
      new Date('2024-01-05'),
    ],
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 13,
    dates: [
      new Date('2024-02-05'),
      new Date('2024-02-06'),
    ],
  },
  {
    segment: 1,
    course_name: 'Leading the audience III',
    fy: '2023-2024',
    run: 14,
    dates: [
      new Date('2024-03-04'),
      new Date('2024-03-05'),
    ],
  },
  {
    segment: 1,
    course_name: 'Split: Trainers',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2023-05-01'),
      new Date('2023-05-01'),
    ],
  },
  {
    segment: 2,
    course_name: 'Split: Trainers',
    fy: '2023-2024',
    run: 1,
    dates: [
      new Date('2023-05-02'),
      new Date('2023-05-02'),
    ],
  },
];
