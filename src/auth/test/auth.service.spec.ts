import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { db, oneUser } from "../../../test/data";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { getMockRes } from "@jest-mock/express";
import { NotificationsService } from "../../notifications/notifications.service";
import { ResetPasswordDto, ChangePasswordDto, LoginDto } from "../dto";
import { ForbiddenException } from "@nestjs/common";

describe("Auth Service", () => {
  let service: AuthService;
  const { res } = getMockRes();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule, ConfigService],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key == "JWT_EXPIRATION") {
                return "2592000";
              }
              if (key == "JWT_SECRET") {
                return "52abb127f203d5ee17fd4c3a3062f53dd643bb4294b64b234657e2e8797fa33";
              }
              return null;
            }),
          },
        },
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

    service = module.get<AuthService>(AuthService);
  });

  it("Auth Service should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("signup", () => {
    it("signup successfully and return user_name", async () => {
      db.user.findMany.mockResolvedValue([]);
      const signup = await service.signup(oneUser, res);
      expect(signup).toEqual(oneUser.user_name);
    });
  });

  describe("signin", () => {
    it("signin successfully and return user information", async () => {
      const loginDto = {
        user_name: oneUser.user_name,
        password: oneUser.password,
      };
      try {
        const user = await service.signin(loginDto, res);
        expect(user).toEqual(oneUser);
      } catch (e) {
        expect(e.message).toEqual("Credentials incorrect");
        return;
      }
      fail("it should not reach here");
    });
  });

  describe("signin/token", () => {
    it("signin successfully, return token has been verified", async () => {
      const loginDto: LoginDto = {
        user_name: oneUser.user_name,
        password: "naruto",
      };
      const user = await service.signinToken(loginDto, res);
      expect(user).toBeInstanceOf(Object);
      expect(user).toHaveProperty("access_token");
    });
  });

  describe("signin/token", () => {
    it("signin failed, invalid credentials", async () => {
      const loginDto: LoginDto = {
        user_name: oneUser.user_name,
        password: "wrongPassword",
      };
      try {
        await service.signinToken(loginDto, res);
      } catch (err) {
        expect(err).toEqual(new ForbiddenException("Credentials incorrect"));
      }
    });
  });

  describe("changePassword", () => {
    it("change password successfully", async () => {
      const changePasswordDto: ChangePasswordDto = {
        user_name: oneUser.user_name,
        currentPassword: "naruto",
        newPassword: "newPassword",
      };
      const changePassword = await service.changePassword(
        changePasswordDto,
        res,
      );
      expect(changePassword).toBe(oneUser.user_name);
    });
  });

  describe("changePassword", () => {
    it("change password failure", async () => {
      const changePasswordDto: ChangePasswordDto = {
        user_name: oneUser.user_name,
        currentPassword: oneUser.password,
        newPassword: "newPassword",
      };
      expect(
        service.changePassword(changePasswordDto, res),
      ).rejects.toThrowError(ForbiddenException);
    });
  });

  describe("resetPassword", () => {
    it("reset password successfully", async () => {
      const resetPasswordDto: ResetPasswordDto = {
        user_name: oneUser.user_name,
        email: oneUser.email,
        password: "newPassword",
      };
      const output = await service.resetPassword(resetPasswordDto, res);
      expect(output).toStrictEqual({
        user_name: oneUser.user_name,
        email: oneUser.email,
      });
    });
  });

  describe("resetPassword", () => {
    it("reset password failure", async () => {
      const resetPasswordDto: ResetPasswordDto = {
        user_name: oneUser.user_name,
        email: oneUser.email,
        password: "wrongPassword",
      };
      try {
        await service.resetPassword(resetPasswordDto, res);
      } catch (err) {
        expect(err).toEqual(new ForbiddenException("Credentials incorrect"));
      }
    });
  });
});
