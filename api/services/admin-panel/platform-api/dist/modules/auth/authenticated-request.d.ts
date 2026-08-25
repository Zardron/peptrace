import { AuthenticatedAdminUser } from "./auth.types";
export interface AuthenticatedRequest {
    headers: {
        authorization?: string | string[];
    };
    user?: AuthenticatedAdminUser;
}
