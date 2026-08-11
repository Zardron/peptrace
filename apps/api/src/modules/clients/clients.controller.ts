import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateClientDto } from "./clients.dto";
import { ClientsService } from "./clients.service";

@Controller()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get("clients")
  listClients() {
    return this.clientsService.listClients();
  }

  @Get("clients/:idOrSlug")
  getClient(@Param("idOrSlug") idOrSlug: string) {
    return this.clientsService.getClient(idOrSlug);
  }

  @Post("clients")
  createClient(@Body() dto: CreateClientDto) {
    return this.clientsService.createClient(dto);
  }
}
