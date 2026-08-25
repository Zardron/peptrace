export interface SharedUserbaseAuthStep {
  id: string;
  label: string;
  owner: "client" | "peptrace-api" | "external-userbase" | "peptrace-database";
  description: string;
}

export const sharedUserbaseAuthFlow: readonly SharedUserbaseAuthStep[] = [
  {
    id: "client-auth-request",
    label: "Peptrace API auth request",
    owner: "client",
    description: "Frontend, mobile, or machine clients request Peptrace authentication.",
  },
  {
    id: "m2m-userbase-request",
    label: "Machine-to-machine Userbase request",
    owner: "peptrace-api",
    description: "Peptrace API authenticates server-to-server with the external Userbase service.",
  },
  {
    id: "peptrace-connection-string",
    label: "Get Peptrace Postgres connection string",
    owner: "external-userbase",
    description: "Userbase returns the tenant-scoped Peptrace database connection string.",
  },
  {
    id: "peptrace-data-load",
    label: "Get Userbase data",
    owner: "peptrace-database",
    description: "Peptrace loads the local user, tenant, role, and membership context.",
  },
  {
    id: "return-jwt",
    label: "Return JWT",
    owner: "peptrace-api",
    description: "Peptrace returns a JWT scoped to the resolved user and tenant context.",
  },
] as const;
