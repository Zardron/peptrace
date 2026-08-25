"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.envValidationSchema = Joi.object({
    DATABASE_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).required(),
    DIRECT_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).optional(),
    HOST: Joi.string().hostname().default("127.0.0.1"),
    PORT: Joi.number().port().default(3000),
    CORS_ORIGIN: Joi.string().default("http://localhost:5173,http://127.0.0.1:5173"),
    JWT_SECRET: Joi.string().min(16).default("local-development-secret"),
    DATABASE_CONNECTION_ENCRYPTION_KEY: Joi.string().base64().optional(),
    DATABASE_CONNECTION_ENCRYPTION_KEY_ID: Joi.string().max(64).default("local-v1"),
    DATABASE_CONNECTION_ENCRYPTION_PREVIOUS_KEYS: Joi.string().default("{}"),
    SECRET_ENCRYPTION_KEY: Joi.string().base64().optional(),
    SECRET_ENCRYPTION_KEY_ID: Joi.string().min(1).max(64).default("local-v1"),
    SECRET_ENCRYPTION_PREVIOUS_KEYS: Joi.string().default("{}"),
    SUPERADMIN_EMAIL: Joi.string().email({ tlds: false }).default("admin@esteemedengineering.com"),
    ADMIN_EMAIL: Joi.string().email({ tlds: false }).optional(),
    ADMIN_PASSWORD: Joi.string().min(8).default("Admin@123")
});
//# sourceMappingURL=env.validation.js.map