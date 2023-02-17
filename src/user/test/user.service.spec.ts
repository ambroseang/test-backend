import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { UserController } from "../user.controller";
import { UserService } from "../user.service";
import { db, oneUser, userData } from "../../../test/data";
import { GetUserDto, UpdateUserDto } from "../dto";

describe("User Service", () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it("User Service should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getUsers", () => {
    it("should return an array of users", async () => {
      const users = await service.getUsers();
      expect(users).toEqual(userData);
    });
  });

  describe("getTrainers", () => {
    it("should return an array of trainers", async () => {
      const trainers = await service.getTrainers();
      expect(trainers).toEqual(userData);
    });
  });

  describe("getOneUser", () => {
    it("should return an object of user", async () => {
      const input: GetUserDto = oneUser;
      const user = await service.getUser(input);
      expect(user).toEqual(oneUser);
    });
  });

  describe("updateUser", () => {
    it("should update the user and return the updated user", async () => {
      const input: UpdateUserDto = oneUser;
      const user = await service.patchUser(input);
      expect(user).toEqual(oneUser);
    });
  });

  describe("ifUserExist", () => {
    it("return True if user does exist", async () => {
      const user = await service.ifUserExist(oneUser.user_name);
      expect(user).toEqual(true);
    });
  });

  describe("ifUserExist", () => {
    it("return False if user does not exist", async () => {
      db.user.findMany.mockResolvedValue([]);
      const user = await service.ifUserExist(oneUser.user_name);
      expect(user).toEqual(false);
    });
  });
});
