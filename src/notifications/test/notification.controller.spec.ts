import { MailerModule, MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/prisma/prisma.service";
import { TrainerService } from "src/trainer/trainer.service";
import { UserService } from "src/user/user.service";
import { db } from "../../../test/data";
import { NotificationsController } from "../notifications.controller";
import { NotificationsService } from "../notifications.service";

describe("Notification Controller", () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController, MailerModule],
      providers: [
        NotificationsService,
        ConfigService,
        TrainerService,
        UserService,
        {
          provide: MailerService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("adhocEmail", () => {
    it("should be defined", async () => {
      expect(controller.adhocEmail).toBeDefined();
    });
  });
});
