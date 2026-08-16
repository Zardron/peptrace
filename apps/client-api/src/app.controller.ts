import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: "Peptrace Client API",
      version: "0.1.0",
      health: "/client-api/health",
      routeGroups: [
        "/client-api/auth/*",
        "/client-api/admin-panel/context",
        "/client-api/admin-panel/data",
        "/client-api/users"
      ]
    };
  }
}
