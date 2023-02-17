import { PartialType } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";

// PartialType: Can have all the properties of CreateUserDto
export class UpdateUserDto extends PartialType(CreateUserDto) {}
