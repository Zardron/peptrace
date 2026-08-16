import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { CurrentClientUser } from "../auth/current-client-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminPanelService } from "./admin-panel.service";

@Controller("admin-panel")
@UseGuards(JwtAuthGuard)
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  @Get("context")
  getContext(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.adminPanelService.getContext(user);
  }

  @Get("data")
  getData(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.adminPanelService.getData(user);
  }
}
