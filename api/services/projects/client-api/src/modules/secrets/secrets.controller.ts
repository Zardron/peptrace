import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { CurrentClientUser } from "../auth/current-client-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedClientUser } from "../auth/auth.types";
import {
  AddSecretVersionDto,
  CreateSecretDto,
  ListSecretAuditQueryDto,
  ListSecretsQueryDto,
  SetSecretGrantDto,
  UpdateSecretDto,
  UpdateSecretVersionDto
} from "./secrets.dto";
import { SecretsService } from "./secrets.service";

@Controller("secrets")
@UseGuards(JwtAuthGuard)
export class SecretsController {
  constructor(private readonly secretsService: SecretsService) {}

  @Get()
  listSecrets(@Query() query: ListSecretsQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.secretsService.listSecrets(query, user);
  }

  @Post()
  createSecret(@Body() dto: CreateSecretDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.secretsService.createSecret(dto, user);
  }

  @Get("audit")
  listAuditEvents(
    @Query() query: ListSecretAuditQueryDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.secretsService.listAuditEvents(query, user);
  }

  @Get(":secret")
  getSecret(@Param("secret") secret: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.secretsService.getSecret(secret, user);
  }

  @Patch(":secret")
  updateSecret(
    @Param("secret") secret: string,
    @Body() dto: UpdateSecretDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.secretsService.updateSecret(secret, dto, user);
  }

  @Get(":secret/versions")
  listVersions(@Param("secret") secret: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.secretsService.listVersions(secret, user);
  }

  @Post(":secret/versions")
  addVersion(
    @Param("secret") secret: string,
    @Body() dto: AddSecretVersionDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.secretsService.addVersion(secret, dto, user);
  }

  @Get(":secret/versions/:version/access")
  @Header("Cache-Control", "no-store, max-age=0")
  @Header("Pragma", "no-cache")
  accessVersion(
    @Param("secret") secret: string,
    @Param("version") version: string,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.secretsService.accessVersion(secret, version, user);
  }

  @Patch(":secret/versions/:version")
  updateVersionState(
    @Param("secret") secret: string,
    @Param("version") version: string,
    @Body() dto: UpdateSecretVersionDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.secretsService.updateVersionState(secret, version, dto, user);
  }

  @Delete(":secret/versions/:version")
  destroyVersion(
    @Param("secret") secret: string,
    @Param("version") version: string,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.secretsService.destroyVersion(secret, version, user);
  }

  @Get(":secret/grants")
  listGrants(@Param("secret") secret: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.secretsService.listGrants(secret, user);
  }

  @Put(":secret/grants/:userId")
  setGrant(
    @Param("secret") secret: string,
    @Param("userId") userId: string,
    @Body() dto: SetSecretGrantDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.secretsService.setGrant(secret, userId, dto, user);
  }

  @Delete(":secret/grants/:userId")
  removeGrant(
    @Param("secret") secret: string,
    @Param("userId") userId: string,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.secretsService.removeGrant(secret, userId, user);
  }
}
