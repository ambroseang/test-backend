import { getMockRes } from "@jest-mock/express";
import { ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "src/notifications/notifications.service";
import { PrismaService } from "src/prisma/prisma.service";
import { db, oneUser, userData } from "../../../test/data";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { ForbiddenException } from "@nestjs/common";
import { AuthDto, LoginDto } from "../dto";
import * as argon from "argon2";

describe("Auth Controller", () => {
  let controller: AuthController;
  const { res } = getMockRes();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, JwtModule, ConfigService],
      providers: [
        AuthService,
        JwtService,
        ConfigService,
        {
          provide: NotificationsService,
          useValue: {
            sendWelcomeEmail: jest.fn().mockResolvedValue(true),
            sendResetPasswordEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("signup - success", () => {
    it("should be defined and successfully signed up", async () => {
      db.user.findMany.mockResolvedValue([]);
      const newUser: AuthDto = oneUser;
      newUser.user_name = "New User";
      newUser.email = "newUser@gmail.com";
      await controller.signup(newUser, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("signup - failure", () => {
    it("should be failed - username taken", async () => {
      db.user.findMany.mockResolvedValue(userData);
      oneUser.password = "naruto";
      try {
        await controller.signup(oneUser, res);
      } catch (err) {
        expect(err).toEqual(new ForbiddenException("Username taken"));
      }
    });
  });

  describe("signin - successfully", () => {
    it("should be defined and successfully signed in", async () => {
      db.user.findMany.mockResolvedValue([]);
      const loginDto: LoginDto = {
        user_name: oneUser.user_name,
        password: "naruto",
      };

      await controller.signin(loginDto, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("signin - failure", () => {
    it("should be defined and failed to signed in", async () => {
      const hash = await argon.hash("naruto");
      const mockValue = {
        password: hash,
        ...oneUser,
      };
      db.user.findUnique.mockResolvedValue(mockValue);

      try {
        const loginDto: LoginDto = {
          user_name: oneUser.user_name,
          password: "naruto",
        };
        await controller.signin(loginDto, res);
      } catch (err) {
        expect(err).toEqual(new ForbiddenException("Credentials incorrect"));
      }
    });
  });

  describe("changePassword", () => {
    it("should be defined", async () => {
      expect(controller.changePassword).toBeDefined();
    });
  });

  describe("signout", () => {
    it("should be defined", async () => {
      expect(controller.signout).toBeDefined();
    });
  });

  describe("resetPassword", () => {
    it("should be defined", async () => {
      expect(controller.resetPassword).toBeDefined();
    });
  });
});
