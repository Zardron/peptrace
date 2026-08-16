import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentClientUser } from "../auth/current-client-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { CreateUserDto, ListUsersQueryDto, ResetUserPasswordDto, UpdateUserDto } from "./users.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers(@Query() query: ListUsersQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.usersService.listUsers(query, user);
  }

  @Get(":id")
  getUser(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.usersService.getUser(id, user);
  }

  @Post()
  createUser(@Body() dto: CreateUserDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.usersService.createUser(dto, user);
  }

  @Patch(":id")
  updateUser(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.usersService.updateUser(id, dto, user);
  }

  @Post(":id/password")
  resetPassword(
    @Param("id") id: string,
    @Body() dto: ResetUserPasswordDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.usersService.resetPassword(id, dto, user);
  }

  @Delete(":id")
  deactivateUser(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.usersService.deactivateUser(id, user);
  }
}
