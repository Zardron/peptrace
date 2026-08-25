import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).required(),
  DIRECT_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).optional(),
  HOST: Joi.string().hostname().default("127.0.0.1"),
  CLIENT_API_PORT: Joi.number().port().default(3001),
  CORS_ORIGIN: Joi.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  JWT_SECRET: Joi.string().min(16).default("local-development-secret"),
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  SECRET_ENCRYPTION_KEY: Joi.string().base64().optional(),
  SECRET_ENCRYPTION_KEY_ID: Joi.string().min(1).max(64).default("local-v1"),
  SECRET_ENCRYPTION_PREVIOUS_KEYS: Joi.string().default("{}")
});
