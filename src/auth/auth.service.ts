import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto, LoginDto, ResetPasswordDto } from "./dto";
import * as argon from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async signup(dto: AuthDto, response: Response) {
    // generate the password hash
    const rawPassword = dto.password;
    const password = await argon.hash(rawPassword);
    // set the hash password
    dto.password = password;
    // save the new user in the db
    try {
      // case insensitive check if user exists
      const exist = await this.prisma.user.findMany({
        where: {
          user_name: {
            equals: dto.user_name,
            mode: "insensitive",
          },
        },
      });

      // if user exists throw exception
      if (exist.length > 0) throw new ForbiddenException("Username taken");

      // else continue creating user
      const user = await this.prisma.user.create({
        data: {
          ...dto,
        },
      });

      await this.notificationsService.sendWelcomeEmail(
        user.email,
        user.user_name,
        rawPassword,
      );

      return user.user_name;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ForbiddenException("Credentials taken");
        }
      }
      throw error;
    }
  }

  async signin(dto: LoginDto, response: Response) {
    // find the user by user_name
    const user = await this.prisma.user.findUnique({
      where: {
        user_name: dto.user_name,
      },
    });
    // if user does not exist throw exception
    if (!user) throw new ForbiddenException("Credentials incorrect");
    // compare password
    const pwMatches = await argon.verify(user.password, dto.password);
    // if password incorrect throw exception
    if (!pwMatches) throw new ForbiddenException("Credentials incorrect");

    delete user.password;

    return user;
  }

  async signinToken(dto: LoginDto, response: Response) {
    // find the user by user_name
    const user = await this.prisma.user.findUnique({
      where: {
        user_name: dto.user_name,
      },
    });
    // if user does not exist throw exception
    if (!user) throw new ForbiddenException("Credentials incorrect");

    // compare password
    const pwMatches = await argon.verify(user.password, dto.password);
    // if password incorrect throw exception
    if (!pwMatches) throw new ForbiddenException("Credentials incorrect");

    const expires = new Date();
    expires.setSeconds(
      expires.getSeconds() + this.configService.get("JWT_EXPIRATION"),
    );

    const token = this.signToken(user.user_name, user.email);

    return token;
  }

  async signout(response: Response) {
    response.cookie("Authentication", "", {
      httpOnly: true,
      expires: new Date(),
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, response: Response) {
    const user = await this.prisma.user.findFirst({
      where: {
        user_name: resetPasswordDto.user_name,
        email: resetPasswordDto.email,
      },
    });

    if (user) {
      // generate the password hash
      const password = await argon.hash(resetPasswordDto.password);
      // save the new user in the db
      try {
        const user = await this.prisma.user.update({
          where: {
            user_name: resetPasswordDto.user_name,
          },
          data: {
            password: password,
          },
        });

        // notification service
        await this.notificationsService.sendResetPasswordEmail(
          user.email,
          user.user_name,
          resetPasswordDto.password,
        );

        return { user_name: user.user_name, email: user.email };
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new ForbiddenException("Credentials taken");
          }
        }
        throw error;
      }
    } else {
      throw new ForbiddenException("Credentials incorrect");
    }
  }

  async changePassword(dto: ChangePasswordDto, response: Response) {
    // find the user by user_name
    const user = await this.prisma.user.findUnique({
      where: {
        user_name: dto.user_name,
      },
    });
    // if user does not exist throw exception
    if (!user) throw new ForbiddenException("Credentials incorrect");

    // compare password
    const pwMatches = await argon.verify(user.password, dto.currentPassword);
    // if password incorrect throw exception
    if (!pwMatches) throw new ForbiddenException("Credentials incorrect");

    // generate the password hash
    const password = await argon.hash(dto.newPassword);

    // set the hash password
    dto.newPassword = password;

    // save the new user in the db
    try {
      const user = await this.prisma.user.update({
        where: {
          user_name: dto.user_name,
        },
        data: {
          password: dto.newPassword,
        },
      });
      return user.user_name;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ForbiddenException("Credentials taken");
        }
      }
      throw error;
    }
  }

  // ======================================= HELPER FUNCTIONS ==========================================
  async signToken(
    user_name: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      user_name: user_name,
      email,
    };

    const secret = this.configService.get("JWT_SECRET");

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: `${this.configService.get("JWT_EXPIRATION")}s`,
      secret: secret,
    });

    return {
      access_token: token,
    };
  }
}
