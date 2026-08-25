import { LoginDto, SwitchTenantDto } from "./auth.dto";
import { AuthService } from "./auth.service";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<import("./auth.types").ClientSession>;
    refresh(authorization: string | undefined): Promise<import("./auth.types").ClientSession>;
    switchTenant(authorization: string | undefined, dto: SwitchTenantDto): Promise<import("./auth.types").ClientSession>;
    me(authorization: string | undefined): Promise<import("./auth.types").AuthenticatedClientUser>;
}
