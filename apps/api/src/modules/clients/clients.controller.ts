import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CurrentAdminUser } from "../auth/current-admin-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateClientDto } from "./clients.dto";
import { ClientsService } from "./clients.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get("clients")
  listClients(@CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.clientsService.listClients(user);
  }

  @Get("clients/:idOrSlug")
  getClient(@Param("idOrSlug") idOrSlug: string, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.clientsService.getClient(idOrSlug, user);
  }

  @Post("clients")
  createClient(@Body() dto: CreateClientDto, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.clientsService.createClient(dto, user);
  }
}
