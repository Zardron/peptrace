export type AuthChannel = "frontend" | "mobile" | "machine-to-machine";

export interface UserbaseLoginRequest {
  channel: AuthChannel;
  email?: string;
  password?: string;
  machineClientId?: string;
  machineClientSecret?: string;
}

export interface UserbaseLoginResult {
  userbaseUserId: string;
  email: string;
  displayName?: string;
  tenantId: string;
  roles: readonly string[];
}

export interface PeptraceConnectionRequest {
  tenantId: string;
  userbaseUserId: string;
}

export interface ExternalUserbaseClient {
  login(request: UserbaseLoginRequest): Promise<UserbaseLoginResult>;
  getPeptracePostgresConnectionString(
    request: PeptraceConnectionRequest,
  ): Promise<string>;
}

export class UserbaseServiceClient {
  constructor(private readonly client: ExternalUserbaseClient) {}

  login(request: UserbaseLoginRequest): Promise<UserbaseLoginResult> {
    return this.client.login(request);
  }

  getPeptracePostgresConnectionString(
    request: PeptraceConnectionRequest,
  ): Promise<string> {
    return this.client.getPeptracePostgresConnectionString(request);
  }
}
