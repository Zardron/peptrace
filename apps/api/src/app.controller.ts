import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: "EsteemedEngineering Superadmin API",
      version: "0.1.0",
      health: "/api/health",
      routeGroups: [
        "/api/auth/*",
        "/api/admin-panel/context",
        "/api/clients",
        "/api/vendors",
        "/api/vendor/:idOrSlug",
        "/api/peptides",
        "/api/peptide/:idOrSlug",
        "/api/labs",
        "/api/testing",
        "/api/account/profile",
        "/api/billing",
        "/api/authorization/api-keys"
      ]
    };
  }
}
