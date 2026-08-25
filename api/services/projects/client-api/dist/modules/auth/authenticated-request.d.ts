import { AuthenticatedClientUser } from "./auth.types";
export interface AuthenticatedRequest {
    headers: {
        authorization?: string | string[];
    };
    user?: AuthenticatedClientUser;
}
