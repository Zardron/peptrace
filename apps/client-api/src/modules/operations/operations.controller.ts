import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { CurrentClientUser } from "../auth/current-client-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OperationsService } from "./operations.service";

@Controller("operations")
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  getSummary(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.operationsService.getSummary(user);
  }

  @Get("records")
  getRecords(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.operationsService.getRecords(user);
  }

  @Get("work-items")
  getWorkItems(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.operationsService.getWorkItems(user);
  }
}
