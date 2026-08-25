import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const superAdminProxyTarget = process.env.SUPERADMIN_API_PROXY_TARGET ?? "http://127.0.0.1:3000";
const clientApiProxyTarget = process.env.CLIENT_API_PROXY_TARGET ?? "http://127.0.0.1:3001";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@peptrace/api-client": fileURLToPath(new URL("../packages/api-client/src/index.ts", import.meta.url)),
      "@peptrace/domain": fileURLToPath(new URL("../packages/domain/src/index.ts", import.meta.url))
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": superAdminProxyTarget,
      "/client-api": clientApiProxyTarget
    }
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  }
});
