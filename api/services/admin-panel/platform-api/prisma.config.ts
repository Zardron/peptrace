import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const configDir = dirname(fileURLToPath(import.meta.url));

[
  resolve(configDir, ".env.local"),
  resolve(configDir, ".env"),
  resolve(configDir, "../../.env.local"),
  resolve(configDir, "../../.env")
].forEach((path) => {
  config({ path });
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://peptrace:peptrace@localhost:5432/peptrace?schema=public"
  }
});
