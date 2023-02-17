import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, LoginDto, ResetPasswordDto } from "./dto";
import { Response } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { JwtGuard } from "./guard";

@Controller("auth")
@ApiTags("Authentication")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post("signup")
  async signup(
    @Body() body: AuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user_name = await this.authService.signup(body, response);

    delete body.password; // remove password

    response.status(201);
    response.send({
      user_name: user_name,
      ...body,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post("signin")
  async signin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.signin(body, response);
    response.status(201);
    response.send(user); // w/o p/w
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post("change/password")
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.changePassword(dto, response);
  }

  @HttpCode(HttpStatus.OK)
  @Post("signin/token")
  async signinToken(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.signinToken(body, response);
  }

  @Post("signout")
  async signout(@Res({ passthrough: true }) response: Response) {
    await this.authService.signout(response);
    return {
      status: 200,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("resetPassword")
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.resetPassword(body, response);
  }
}
