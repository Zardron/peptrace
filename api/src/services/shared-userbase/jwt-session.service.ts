export interface AuthenticatedPeptraceUser {
  id: string;
  email: string;
  displayName?: string;
  tenantId: string;
  roles: readonly string[];
}

export interface JwtIssuer {
  issue(payload: AuthenticatedPeptraceUser): Promise<string> | string;
}

export class JwtSessionService {
  constructor(private readonly issuer: JwtIssuer) {}

  async returnJwt(user: AuthenticatedPeptraceUser): Promise<string> {
    return this.issuer.issue(user);
  }
}
