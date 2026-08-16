import type { PoolConfig } from "pg";

export function createPostgresPoolOptions(connectionString: string): PoolConfig {
  const url = new URL(connectionString);
  const isSupabase = url.hostname === "supabase.com" || url.hostname.endsWith(".supabase.com");

  url.searchParams.delete("sslmode");

  return {
    connectionString: url.toString(),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    keepAlive: true,
    max: 5,
    ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {})
  };
}
