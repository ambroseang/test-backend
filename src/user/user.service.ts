import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GetUserDto, UpdateUserDto } from "./dto";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {} // connection to Database through Prisma

  async getUsers() {
    return this.prisma.user.findMany();
  }

  async getUser(dto: GetUserDto) {
    return this.prisma.user.findUnique({
      where: { user_name: dto.user_name },
    });
  }

  async getTrainers() {
    return this.prisma.user.findMany({
      where: {
        role: "TRAINER",
      },
      select: {
        user_name: true,
      },
    });
  }

  async patchUser(updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { user_name: updateUserDto.user_name },
      data: updateUserDto,
    });

    delete user.password; // remove password from return

    return user;
  }

  async ifUserExist(user_name: string) {
    const user = await this.prisma.user.findMany({
      where: {
        user_name: {
          equals: user_name,
          mode: "insensitive",
        },
      },
    });
    if (user.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  // async deleteUser(user_name: string) {
  //   return this.prisma.user.delete({ where: { user_name } });
  // }

  // async editUser(
  //   userId: number,
  //   dto: UpdateUserDto,
  // ) {
  //   const user = await this.prisma.user.update({
  //     where: {
  //       id: userId,
  //     },
  //     data: {
  //       ...dto,
  //     },
  //   });

  //   delete user.password;

  //   return user;
  // }
}
