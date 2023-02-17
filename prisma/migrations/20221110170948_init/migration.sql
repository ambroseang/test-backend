-- CreateEnum
CREATE TYPE "Status" AS ENUM ('GENERATED', 'REVIEWED', 'PENDING', 'ACCEPTED', 'DECLINED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PM', 'TRAINER');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('F2F', 'ONLINE');

-- CreateTable
CREATE TABLE "FiscalYear" (
    "fy" TEXT NOT NULL,
    "revenue_target" DOUBLE PRECISION,
    "day_limit" INTEGER,
    "blackout_dates" JSONB,
    "low_manpower_dates" JSONB,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("fy")
);

-- CreateTable
CREATE TABLE "Programme" (
    "programme_name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("programme_name")
);

-- CreateTable
CREATE TABLE "Course" (
    "course_name" TEXT NOT NULL,
    "programme_name" TEXT NOT NULL,
    "course_code" TEXT NOT NULL,
    "delivery_mode" "DeliveryMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("course_name")
);

-- CreateTable
CREATE TABLE "CourseConfig" (
    "course_name" TEXT NOT NULL,
    "fy" TEXT NOT NULL,
    "days_per_run" INTEGER NOT NULL,
    "runs_per_year" INTEGER NOT NULL,
    "course_fees" DOUBLE PRECISION,
    "start_time" TIME(5),
    "end_time" TIME(5),
    "days_to_avoid" INTEGER[],
    "avoid_month_start" BOOLEAN NOT NULL,
    "avoid_month_end" BOOLEAN NOT NULL,
    "split" INTEGER[],
    "trainers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseConfig_pkey" PRIMARY KEY ("course_name","fy")
);

-- CreateTable
CREATE TABLE "CourseRun" (
    "run" INTEGER NOT NULL,
    "course_name" TEXT NOT NULL,
    "fy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRun_pkey" PRIMARY KEY ("run","course_name","fy")
);

-- CreateTable
CREATE TABLE "CourseSegment" (
    "segment" INTEGER NOT NULL,
    "course_name" TEXT NOT NULL,
    "fy" TEXT NOT NULL,
    "run" INTEGER NOT NULL,
    "dates" TIMESTAMP(5)[],
    "status" "Status" NOT NULL DEFAULT E'GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseSegment_pkey" PRIMARY KEY ("segment","course_name","fy","run")
);

-- CreateTable
CREATE TABLE "User" (
    "user_name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT E'TRAINER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_name")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "user_name" TEXT NOT NULL,
    "segment" INTEGER NOT NULL,
    "course_name" TEXT NOT NULL,
    "fy" TEXT NOT NULL,
    "run" INTEGER NOT NULL,
    "assignment_status" "Status" NOT NULL DEFAULT E'GENERATED',
    "decline_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("user_name","segment","course_name","fy","run")
);

-- CreateTable
CREATE TABLE "Notification" (
    "time_sent" TIME(5) NOT NULL,
    "user_name" TEXT NOT NULL,
    "segment" INTEGER NOT NULL,
    "course_name" TEXT NOT NULL,
    "fy" TEXT NOT NULL,
    "run" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("time_sent","user_name","segment","course_name","fy","run")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_fy_key" ON "FiscalYear"("fy");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_programme_name_key" ON "Programme"("programme_name");

-- CreateIndex
CREATE UNIQUE INDEX "Course_course_name_key" ON "Course"("course_name");

-- CreateIndex
CREATE UNIQUE INDEX "CourseConfig_course_name_fy_key" ON "CourseConfig"("course_name", "fy");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRun_run_course_name_fy_key" ON "CourseRun"("run", "course_name", "fy");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSegment_segment_course_name_fy_run_key" ON "CourseSegment"("segment", "course_name", "fy", "run");

-- CreateIndex
CREATE UNIQUE INDEX "User_user_name_key" ON "User"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_user_name_segment_course_name_fy_run_key" ON "Assignment"("user_name", "segment", "course_name", "fy", "run");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_time_sent_user_name_segment_course_name_fy_run_key" ON "Notification"("time_sent", "user_name", "segment", "course_name", "fy", "run");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_programme_name_fkey" FOREIGN KEY ("programme_name") REFERENCES "Programme"("programme_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseConfig" ADD CONSTRAINT "CourseConfig_fy_fkey" FOREIGN KEY ("fy") REFERENCES "FiscalYear"("fy") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseConfig" ADD CONSTRAINT "CourseConfig_course_name_fkey" FOREIGN KEY ("course_name") REFERENCES "Course"("course_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRun" ADD CONSTRAINT "CourseRun_course_name_fy_fkey" FOREIGN KEY ("course_name", "fy") REFERENCES "CourseConfig"("course_name", "fy") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSegment" ADD CONSTRAINT "CourseSegment_run_fy_course_name_fkey" FOREIGN KEY ("run", "fy", "course_name") REFERENCES "CourseRun"("run", "fy", "course_name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_segment_course_name_fy_run_fkey" FOREIGN KEY ("segment", "course_name", "fy", "run") REFERENCES "CourseSegment"("segment", "course_name", "fy", "run") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_user_name_fkey" FOREIGN KEY ("user_name") REFERENCES "User"("user_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_name_segment_course_name_fy_run_fkey" FOREIGN KEY ("user_name", "segment", "course_name", "fy", "run") REFERENCES "Assignment"("user_name", "segment", "course_name", "fy", "run") ON DELETE CASCADE ON UPDATE CASCADE;
