import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CurrentAdminUser } from "../auth/current-admin-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CreateBackendServiceDto,
  ListBackendServicesQueryDto,
  UpdateBackendServiceDto,
  UpsertTenantBackendServiceDto
} from "./backend-services.dto";
import { BackendServicesService } from "./backend-services.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class BackendServicesController {
  constructor(private readonly backendServicesService: BackendServicesService) {}

  @Get("services")
  listServices(@Query() query: ListBackendServicesQueryDto, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.backendServicesService.listServices(query, user);
  }

  @Get("services/:serviceKey")
  getService(@Param("serviceKey") serviceKey: string, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.backendServicesService.getService(serviceKey, user);
  }

  @Post("services")
  createService(@Body() dto: CreateBackendServiceDto, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.backendServicesService.createService(dto, user);
  }

  @Patch("services/:serviceKey")
  updateService(
    @Param("serviceKey") serviceKey: string,
    @Body() dto: UpdateBackendServiceDto,
    @CurrentAdminUser() user: AuthenticatedAdminUser
  ) {
    return this.backendServicesService.updateService(serviceKey, dto, user);
  }

  @Get("clients/:tenantId/services")
  listTenantServices(@Param("tenantId") tenantId: string, @CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.backendServicesService.listTenantServices(tenantId, user);
  }

  @Get("clients/:tenantId/services/:serviceKey")
  getTenantService(
    @Param("tenantId") tenantId: string,
    @Param("serviceKey") serviceKey: string,
    @CurrentAdminUser() user: AuthenticatedAdminUser
  ) {
    return this.backendServicesService.getTenantService(tenantId, serviceKey, user);
  }

  @Put("clients/:tenantId/services/:serviceKey")
  upsertTenantService(
    @Param("tenantId") tenantId: string,
    @Param("serviceKey") serviceKey: string,
    @Body() dto: UpsertTenantBackendServiceDto,
    @CurrentAdminUser() user: AuthenticatedAdminUser
  ) {
    return this.backendServicesService.upsertTenantService(tenantId, serviceKey, dto, user);
  }

  @Delete("clients/:tenantId/services/:serviceKey")
  removeTenantService(
    @Param("tenantId") tenantId: string,
    @Param("serviceKey") serviceKey: string,
    @CurrentAdminUser() user: AuthenticatedAdminUser
  ) {
    return this.backendServicesService.removeTenantService(tenantId, serviceKey, user);
  }
}
