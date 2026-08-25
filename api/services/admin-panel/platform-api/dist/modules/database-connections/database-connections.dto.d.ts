export declare enum DatabaseProvider {
    MONGODB = "MONGODB",
    MYSQL = "MYSQL",
    POSTGRESQL = "POSTGRESQL",
    SUPABASE = "SUPABASE"
}
export declare enum DatabaseSslMode {
    DISABLE = "DISABLE",
    REQUIRE = "REQUIRE",
    VERIFY_CA = "VERIFY_CA",
    VERIFY_FULL = "VERIFY_FULL"
}
export declare enum DatabaseConnectionMode {
    DIRECT = "DIRECT",
    SESSION_POOLER = "SESSION_POOLER",
    STANDARD = "STANDARD",
    TRANSACTION_POOLER = "TRANSACTION_POOLER"
}
export declare class UpsertDatabaseConnectionDto {
    provider: DatabaseProvider;
    displayName: string;
    host: string;
    port: number;
    databaseName: string;
    username?: string;
    password?: string;
    sslMode: DatabaseSslMode;
    connectionMode: DatabaseConnectionMode;
    schemaName?: string;
    authSource?: string;
    replicaSet?: string;
    useSrv?: boolean;
}
