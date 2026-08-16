import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { LoginDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  refresh(@Headers("authorization") authorization: string | undefined) {
    return this.authService.refresh(authorization);
  }

  @Get("me")
  me(@Headers("authorization") authorization: string | undefined) {
    return this.authService.me(authorization);
  }
}
