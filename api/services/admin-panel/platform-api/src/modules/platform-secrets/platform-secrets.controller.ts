import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CurrentAdminUser } from "../auth/current-admin-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePlatformSecretDto } from "./platform-secrets.dto";
import { PlatformSecretsService } from "./platform-secrets.service";

@Controller("system/secrets")
@UseGuards(JwtAuthGuard)
export class PlatformSecretsController {
  constructor(private readonly platformSecretsService: PlatformSecretsService) {}

  @Post()
  createSecret(@Body() dto: CreatePlatformSecretDto, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.platformSecretsService.createSecret(dto, user);
  }
}
