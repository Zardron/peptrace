import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).required(),
  DIRECT_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).optional(),
  PORT: Joi.number().port().default(3000),
  CORS_ORIGIN: Joi.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  JWT_SECRET: Joi.string().min(16).default("local-development-secret"),
  ADMIN_EMAIL: Joi.string().email({ tlds: false }).default("admin@peptrace.com"),
  ADMIN_PASSWORD: Joi.string().min(8).default("Admin@123")
});
