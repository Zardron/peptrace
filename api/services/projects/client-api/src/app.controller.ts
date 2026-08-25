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
        "/client-api/operations",
        "/client-api/quality",
        "/client-api/public/quality",
        "/client-api/public/real-estate",
        "/client-api/public/shamstay",
        "/client-api/real-estate",
        "/client-api/shamstay",
        "/client-api/users",
        "/client-api/services",
        "/client-api/secrets"
      ]
    };
  }
}
