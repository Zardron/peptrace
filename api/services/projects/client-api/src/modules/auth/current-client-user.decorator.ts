import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthenticatedRequest } from "./authenticated-request";

export const CurrentClientUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

  if (!request.user) {
    throw new UnauthorizedException("Missing authenticated client user");
  }

  return request.user;
});
