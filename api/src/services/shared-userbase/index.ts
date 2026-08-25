export {
  sharedUserbaseAuthFlow,
  type SharedUserbaseAuthStep,
} from "./auth-flow.js";
export {
  SharedUserbaseAuthService,
  type AuthChannel,
  type PeptraceAuthRequest,
  type PeptraceAuthResponse,
} from "./shared-userbase-auth.service.js";
export {
  PeptraceDatabaseAccessService,
  type PeptraceDatabaseConnection,
  type PeptraceDatabaseConnectionStore,
} from "./peptrace-database-access.service.js";
export {
  UserbaseServiceClient,
  type ExternalUserbaseClient,
  type UserbaseLoginRequest,
  type UserbaseLoginResult,
} from "./userbase-service-client.js";
export {
  JwtSessionService,
  type AuthenticatedPeptraceUser,
  type JwtIssuer,
} from "./jwt-session.service.js";

export const sharedUserbaseServices = [
  "auth",
  "users",
  "tenant-membership",
  "external-userbase",
  "database-access",
  "jwt-session",
  "prisma",
  "health",
] as const;

export const sharedUserbaseBoundaries = [
  "identity",
  "roles",
  "tenant-access",
  "machine-to-machine-auth",
  "peptrace-database-routing",
  "session-auth",
] as const;
