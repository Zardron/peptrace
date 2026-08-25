import { AuthenticatedAdminUser } from "../auth/auth.types";
import { UpsertDatabaseConnectionDto } from "./database-connections.dto";
import { DatabaseConnectionsService } from "./database-connections.service";
export declare class DatabaseConnectionsController {
    private readonly databaseConnectionsService;
    constructor(databaseConnectionsService: DatabaseConnectionsService);
    listConnections(user: AuthenticatedAdminUser): Promise<{
        recommendedProvider: import("./database-connections.dto").DatabaseProvider;
        clients: {
            id: string;
            name: string;
            slug: string;
            dataRegion: string;
            mode: string;
            connection: {
                id: string;
                tenantId: string;
                provider: string;
                displayName: string;
                host: string;
                port: number;
                databaseName: string;
                username: string | null;
                hasPassword: boolean;
                sslMode: string;
                connectionMode: string;
                schemaName: string | null;
                authSource: string | null;
                replicaSet: string | null;
                useSrv: boolean;
                status: string;
                lastTestedAt: string | null;
                lastTestMessage: string | null;
                updatedByEmail: string;
                createdAt: string;
                updatedAt: string;
                maskedConnectionString: string;
            } | null;
        }[];
    }>;
    getProviderCatalog(user: AuthenticatedAdminUser): {
        recommendation: {
            provider: import("./database-connections.dto").DatabaseProvider;
            summary: string;
        };
        providers: {
            id: import("./database-connections.dto").DatabaseProvider;
            name: string;
            defaultPort: number;
            requiredFields: string[];
            optionalFields: string[];
            notes: string;
        }[];
    };
    upsertConnection(tenantId: string, dto: UpsertDatabaseConnectionDto, user: AuthenticatedAdminUser): Promise<{
        id: string;
        tenantId: string;
        provider: string;
        displayName: string;
        host: string;
        port: number;
        databaseName: string;
        username: string | null;
        hasPassword: boolean;
        sslMode: string;
        connectionMode: string;
        schemaName: string | null;
        authSource: string | null;
        replicaSet: string | null;
        useSrv: boolean;
        status: string;
        lastTestedAt: string | null;
        lastTestMessage: string | null;
        updatedByEmail: string;
        createdAt: string;
        updatedAt: string;
        maskedConnectionString: string;
    }>;
    testConnection(tenantId: string, user: AuthenticatedAdminUser): Promise<{
        success: boolean;
        connection: {
            id: string;
            tenantId: string;
            provider: string;
            displayName: string;
            host: string;
            port: number;
            databaseName: string;
            username: string | null;
            hasPassword: boolean;
            sslMode: string;
            connectionMode: string;
            schemaName: string | null;
            authSource: string | null;
            replicaSet: string | null;
            useSrv: boolean;
            status: string;
            lastTestedAt: string | null;
            lastTestMessage: string | null;
            updatedByEmail: string;
            createdAt: string;
            updatedAt: string;
            maskedConnectionString: string;
        };
    }>;
    useSharedDatabase(tenantId: string, user: AuthenticatedAdminUser): Promise<{
        tenantId: string;
        mode: string;
        connection: null;
    }>;
}
