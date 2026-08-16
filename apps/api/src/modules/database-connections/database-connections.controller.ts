import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CurrentAdminUser } from "../auth/current-admin-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpsertDatabaseConnectionDto } from "./database-connections.dto";
import { DatabaseConnectionsService } from "./database-connections.service";

@Controller("system")
@UseGuards(JwtAuthGuard)
export class DatabaseConnectionsController {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  @Get("database-connections")
  listConnections(@CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.databaseConnectionsService.listConnections(user);
  }

  @Get("database-providers")
  getProviderCatalog(@CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.databaseConnectionsService.getProviderCatalog(user);
  }

  @Put("database-connections/:tenantId")
  upsertConnection(
    @Param("tenantId") tenantId: string,
    @Body() dto: UpsertDatabaseConnectionDto,
    @CurrentAdminUser() user: AuthenticatedAdminUser
  ) {
    return this.databaseConnectionsService.upsertConnection(tenantId, dto, user);
  }

  @Post("database-connections/:tenantId/test")
  testConnection(@Param("tenantId") tenantId: string, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.databaseConnectionsService.testConnection(tenantId, user);
  }

  @Delete("database-connections/:tenantId")
  useSharedDatabase(@Param("tenantId") tenantId: string, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.databaseConnectionsService.useSharedDatabase(tenantId, user);
  }
}
