"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const helmet_1 = __importDefault(require("helmet"));
require("reflect-metadata");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const corsOrigin = configService.get("CORS_ORIGIN", "http://localhost:5173");
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim()),
        credentials: true
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true
    }));
    app.setGlobalPrefix("client-api");
    await app.listen(configService.get("CLIENT_API_PORT", 3001), configService.get("HOST", "127.0.0.1"));
}
void bootstrap();
//# sourceMappingURL=main.js.map