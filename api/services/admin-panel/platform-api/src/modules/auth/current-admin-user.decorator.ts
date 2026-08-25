import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthenticatedRequest } from "./authenticated-request";

export const CurrentAdminUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

  if (!request.user) {
    throw new UnauthorizedException("Missing authenticated user");
  }

  return request.user;
});
