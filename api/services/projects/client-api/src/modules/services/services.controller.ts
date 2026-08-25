import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { CurrentClientUser } from "../auth/current-client-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ServicesService } from "./services.service";

@Controller("services")
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  listServices(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.servicesService.listServices(user);
  }

  @Get("catalog")
  listCatalog(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.servicesService.listCatalog(user);
  }

  @Get(":serviceKey")
  getService(@Param("serviceKey") serviceKey: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.servicesService.getService(serviceKey, user);
  }
}
