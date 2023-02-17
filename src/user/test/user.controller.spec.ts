import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/prisma/prisma.service";
import { db } from "../../../test/data";
import { UserController } from "../user.controller";
import { UserService } from "../user.service";

describe("User Controller", () => {
  let controller: UserController;

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

    controller = module.get<UserController>(UserController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getUsers", () => {
    it("should be defined", async () => {
      expect(controller.getUsers).toBeDefined();
    });
  });

  describe("getTrainers", () => {
    it("should be defined", async () => {
      expect(controller.getTrainers).toBeDefined();
    });
  });

  describe("getUser", () => {
    it("should be defined", async () => {
      expect(controller.getUser).toBeDefined();
    });
  });

  describe("patchUser", () => {
    it("should be defined", async () => {
      expect(controller.patchUser).toBeDefined();
    });
  });

  describe("ifUserExist", () => {
    it("should be defined", async () => {
      expect(controller.ifUserExist).toBeDefined();
    });
  });
});
