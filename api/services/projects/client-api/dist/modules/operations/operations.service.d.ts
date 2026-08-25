import { Prisma } from "@prisma/client";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
type OperationRecord = {
    detail: string;
    label: string;
    status: string;
    value: string;
};
type PersistedOperationsPanel = {
    operationsDescription: string;
    operationsTitle: string;
    primaryRecords: Prisma.JsonValue;
    workItems: Prisma.JsonValue;
};
export declare class OperationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSummary(user: AuthenticatedClientUser): Promise<{
        tenant: import("../auth/auth.types").AuthTenant;
        title: string;
        description: string;
        counts: {
            records: number;
            workItems: number;
        };
    }>;
    getRecords(user: AuthenticatedClientUser, panel?: PersistedOperationsPanel): Promise<{
        tenant: import("../auth/auth.types").AuthTenant;
        title: string;
        description: string;
        items: OperationRecord[];
    }>;
    getWorkItems(user: AuthenticatedClientUser, panel?: PersistedOperationsPanel): Promise<{
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
    private getPanel;
    private toOperationRecords;
    private toOperationWorkItems;
    private isOperationRecord;
    private isOperationWorkItem;
}
export {};
