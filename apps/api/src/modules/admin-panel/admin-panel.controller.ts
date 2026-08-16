import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CurrentAdminUser } from "../auth/current-admin-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminPanelService } from "./admin-panel.service";

@Controller("admin-panel")
@UseGuards(JwtAuthGuard)
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  @Get("context")
  getContext(@CurrentAdminUser() user: AuthenticatedAdminUser) {
    return this.adminPanelService.getContext(user);
  }
}
