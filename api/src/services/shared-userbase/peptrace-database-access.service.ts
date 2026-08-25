export interface PeptraceDatabaseConnection {
  tenantId: string;
  postgresConnectionString: string;
}

export interface PeptraceDatabaseConnectionStore {
  saveConnection(connection: PeptraceDatabaseConnection): Promise<void>;
}

export class PeptraceDatabaseAccessService {
  constructor(private readonly store: PeptraceDatabaseConnectionStore) {}

  saveTenantConnection(
    connection: PeptraceDatabaseConnection,
  ): Promise<void> {
    return this.store.saveConnection(connection);
  }
}
