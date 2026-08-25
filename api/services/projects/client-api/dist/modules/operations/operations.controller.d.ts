import { AuthenticatedClientUser } from "../auth/auth.types";
import { OperationsService } from "./operations.service";
export declare class OperationsController {
    private readonly operationsService;
    constructor(operationsService: OperationsService);
    getSummary(user: AuthenticatedClientUser): Promise<{
        tenant: import("../auth/auth.types").AuthTenant;
        title: string;
        description: string;
        counts: {
            records: number;
            workItems: number;
        };
    }>;
    getRecords(user: AuthenticatedClientUser): Promise<{
        tenant: import("../auth/auth.types").AuthTenant;
        title: string;
        description: string;
        items: {
            detail: string;
            label: string;
            status: string;
            value: string;
        }[];
    }>;
    getWorkItems(user: AuthenticatedClientUser): Promise<{
        tenant: import("../auth/auth.types").AuthTenant;
        items: ({
            detail: string;
            label: string;
            priority: "High" | "Medium" | "Low";
            id: string;
            source: "panel";
        } | {
            id: string;
            source: "account-work-item";
            label: string;
            detail: string;
            priority: string;
            dueAt: string;
        })[];
    }>;
}
