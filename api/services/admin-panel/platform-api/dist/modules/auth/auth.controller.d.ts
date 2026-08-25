import { LoginDto, RegisterDto } from "./auth.dto";
import { AuthService } from "./auth.service";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<import("./auth.types").AdminSession>;
    register(dto: RegisterDto): Promise<import("./auth.types").AdminSession & {
        organization: string;
    }>;
    refresh(authorization: string | undefined): Promise<import("./auth.types").AdminSession>;
    me(authorization: string | undefined): Promise<import("./auth.types").AuthenticatedAdminUser>;
}
