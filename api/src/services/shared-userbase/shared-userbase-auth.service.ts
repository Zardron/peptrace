import {
  JwtSessionService,
  type AuthenticatedPeptraceUser,
} from "./jwt-session.service.js";
import { PeptraceDatabaseAccessService } from "./peptrace-database-access.service.js";
import {
  UserbaseServiceClient,
  type AuthChannel,
  type UserbaseLoginRequest,
} from "./userbase-service-client.js";

export type { AuthChannel };

export interface PeptraceAuthRequest extends UserbaseLoginRequest {
  channel: AuthChannel;
}

export interface PeptraceAuthResponse {
  token: string;
  user: AuthenticatedPeptraceUser;
}

export class SharedUserbaseAuthService {
  constructor(
    private readonly userbase: UserbaseServiceClient,
    private readonly databaseAccess: PeptraceDatabaseAccessService,
    private readonly jwtSession: JwtSessionService,
  ) {}

  async userbaseLogin(
    request: PeptraceAuthRequest,
  ): Promise<PeptraceAuthResponse> {
    const userbaseUser = await this.userbase.login(request);
    const postgresConnectionString =
      await this.userbase.getPeptracePostgresConnectionString({
        tenantId: userbaseUser.tenantId,
        userbaseUserId: userbaseUser.userbaseUserId,
      });

    await this.databaseAccess.saveTenantConnection({
      tenantId: userbaseUser.tenantId,
      postgresConnectionString,
    });

    const user: AuthenticatedPeptraceUser = {
      id: userbaseUser.userbaseUserId,
      email: userbaseUser.email,
      displayName: userbaseUser.displayName,
      tenantId: userbaseUser.tenantId,
      roles: userbaseUser.roles,
    };

    return {
      token: await this.jwtSession.returnJwt(user),
      user,
    };
  }
}
