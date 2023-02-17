// import { MailerService } from "@nestjs-modules/mailer";
import { MailerModule, MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { TrainerService } from "../../trainer/trainer.service";
import { UserService } from "../../user/user.service";
import {
  courseSegmentData,
  db,
  oneCourse,
  oneCourseSegment,
} from "../../../test/data";
import { NotificationsService } from "../notifications.service";
import { GetCourseSegmentDto } from "src/course/dto/get-course-segment.dto";
import { Email } from "src/interfaces/email.interfaces";
import { CourseSegment, Status } from "@prisma/client";
import { EditCourseSegmentDto } from "src/course/dto";

describe("Notifications Service", () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MailerModule],
      providers: [
        NotificationsService,
        ConfigService,
        TrainerService,
        UserService,
        {
          provide: MailerService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue({}),
            sendMail: jest.fn().mockResolvedValue(true),
            craftUnassignedEmail: jest.fn().mockResolvedValue(true),
            craftNewlyAssignedEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it("Notifications Service should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendAdhocEmail", () => {
    it("Send an Adhoc Email", async () => {
      const csr: GetCourseSegmentDto[] = courseSegmentData;
      const output = await service.sendAdhocEmail(csr);
      expect(output).toEqual({
        message: "Emails sent successfully",
      });
    });
  });

  describe("notifyTrainersBySegments", () => {
    it("Send multiple trainers by segments through Email", async () => {
      const input: CourseSegment[] = courseSegmentData;
      const output = await service.notifyTrainersBySegments(input);
      expect(output).toBeUndefined(); // successfully sent
    });
  });

  describe("notifyNewlyAssignedTrainers", () => {
    it("Send newly assigned trainers email", async () => {
      const input: EditCourseSegmentDto = {
        bypass: 1,
        newTrainerList: ["Ash Ketchum"],
        status: Status.ACCEPTED,
        course_name: oneCourseSegment.course_name,
        segment: oneCourseSegment.segment,
        run: oneCourseSegment.run,
        fy: oneCourseSegment.fy,
        dates: ["2023-09-09"],
      };
      const output = await service.notifyNewlyAssignedTrainers(
        ["Naruto Uzumaki"],
        input,
      );
      expect(output).toBeUndefined(); // successfully sent
    });
  });

  describe("notifyUnassignedTrainers", () => {
    it("Send multiple trainers by segments through Email", async () => {
      const input: EditCourseSegmentDto = {
        bypass: 1,
        newTrainerList: ["Ash Ketchum"],
        status: Status.ACCEPTED,
        course_name: oneCourseSegment.course_name,
        segment: oneCourseSegment.segment,
        run: oneCourseSegment.run,
        fy: oneCourseSegment.fy,
        dates: ["2023-09-09"],
      };
      const output = await service.notifyUnassignedTrainers(
        ["Naruto Uzumaki"],
        input,
      );
      expect(output).toBeUndefined(); // successfully sent
    });
  });

  describe("send the different emails", () => {
    const email: Email = {
      to: "acadheroesfyp+test@gmail.com",
      from: "acadheroesfyp+receiver@gmail.com",
      subject: "Test Email",
      html: "Test Body",
    };

    it("Send an Email", async () => {
      const input = email;
      const output = await service.sendEmail(input);
      expect(output).toBeUndefined();
    });
  });

  describe("sendWelcomeEmail", () => {
    it("Send a Welcome Email", async () => {
      const output = await service.sendWelcomeEmail(
        "acadheroesfyp+tester1@gmail.com",
        "tester1",
        "rawPassword",
      );
      expect(output).toBeUndefined();
    });
  });

  describe("sendResetPasswodEmail", () => {
    it("Send a Reset Email", async () => {
      const output = await service.sendResetPasswordEmail(
        "acadheroesfyp+tester1@gmail.com",
        "tester1",
        "rawPassword",
      );
      expect(output).toBeUndefined();
    });
  });
});
