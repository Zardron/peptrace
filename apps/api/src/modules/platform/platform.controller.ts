import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateApiKeyDto } from "./platform.dto";
import { PlatformService } from "./platform.service";

@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get("account/profile")
  getAccountProfile() {
    return this.platformService.getAccountProfile();
  }

  @Get("billing")
  getBilling() {
    return this.platformService.getBilling();
  }

  @Get("api-surfaces")
  listApiSurfaces() {
    return this.platformService.listApiSurfaces();
  }

  @Post("authorization/api-keys")
  createApiKey(@Body() dto: CreateApiKeyDto) {
    return this.platformService.createApiKey(dto);
  }
}
