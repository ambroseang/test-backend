import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/guard";
import { GetUserDto, UpdateUserDto } from "./dto";
import { UserService } from "./user.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller("users")
@ApiTags("Users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUsers() {
    return this.userService.getUsers();
  }

  @Get("trainers")
  getTrainers() {
    return this.userService.getTrainers();
  }

  @Post()
  async getUser(@Body() body: GetUserDto) {
    return this.userService.getUser(body);
  }

  // Can do partial changes
  @Patch()
  async patchUser(@Body() updateUserDto: UpdateUserDto) {
    return this.userService.patchUser(updateUserDto);
  }

  @Post("exists")
  async ifUserExist(@Body() body: GetUserDto) {
    return this.userService.ifUserExist(body.user_name);
  }

  // @Delete(':user_name')
  // deleteUser(@Param('user_name') user_name: string) {
  //   return this.userService.deleteUser(user_name);
  // }
}
