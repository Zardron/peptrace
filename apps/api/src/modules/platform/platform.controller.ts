import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CurrentAdminUser } from "../auth/current-admin-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateApiKeyDto } from "./platform.dto";
import { PlatformService } from "./platform.service";

@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get("account/profile")
  @UseGuards(JwtAuthGuard)
  getAccountProfile(@CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.platformService.getAccountProfile(user);
  }

  @Get("billing")
  @UseGuards(JwtAuthGuard)
  getBilling(@CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.platformService.getBilling(user);
  }

  @Get("api-surfaces")
  listApiSurfaces() {
    return this.platformService.listApiSurfaces();
  }

  @Post("authorization/api-keys")
  @UseGuards(JwtAuthGuard)
  createApiKey(@Body() dto: CreateApiKeyDto, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.platformService.createApiKey(dto, user);
  }
}
