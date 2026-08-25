import {
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  LoaderCircle,
  PlugZap,
  RotateCcw,
  Save,
  Server,
  ShieldCheck
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PeptraceApiClient,
  PeptraceApiError,
  type ClientDatabaseAssignment,
  type ClientDatabaseConnection,
  type ClientDatabaseConnectionMode,
  type ClientDatabaseProvider,
  type ClientDatabaseSslMode,
  type DatabaseProviderCatalog,
  type UpsertClientDatabaseConnectionRequest
} from "@peptrace/api-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SelectMenu } from "./SelectMenu";

type ConnectionForm = UpsertClientDatabaseConnectionRequest & { password: string };

const providerDefaults: Record<ClientDatabaseProvider, Pick<ConnectionForm, "port" | "sslMode" | "connectionMode">> = {
  POSTGRESQL: { port: 5432, sslMode: "VERIFY_FULL", connectionMode: "STANDARD" },
  SUPABASE: { port: 5432, sslMode: "VERIFY_FULL", connectionMode: "DIRECT" },
  MYSQL: { port: 3306, sslMode: "VERIFY_FULL", connectionMode: "STANDARD" },
  MONGODB: { port: 27017, sslMode: "VERIFY_FULL", connectionMode: "STANDARD" }
};

const emptyForm = (provider: ClientDatabaseProvider = "POSTGRESQL"): ConnectionForm => ({
  provider,
  displayName: `${providerName(provider)} production`,
  host: "",
  port: providerDefaults[provider].port,
  databaseName: "",
  username: "",
  password: "",
  sslMode: providerDefaults[provider].sslMode,
  connectionMode: providerDefaults[provider].connectionMode,
  schemaName: provider === "POSTGRESQL" || provider === "SUPABASE" ? "public" : "",
  authSource: provider === "MONGODB" ? "admin" : "",
  replicaSet: "",
  useSrv: provider === "MONGODB"
});

export function SystemConfiguration({ api }: { api: PeptraceApiClient }) {
  const [clients, setClients] = useState<ClientDatabaseAssignment[]>([]);
  const [catalog, setCatalog] = useState<DatabaseProviderCatalog | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [form, setForm] = useState<ConnectionForm>(() => emptyForm());
  const [isDedicatedMode, setIsDedicatedMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listClientDatabaseConnections(), api.getDatabaseProviderCatalog()])
      .then(([connectionList, providerCatalog]) => {
        if (cancelled) return;
        setClients(connectionList.clients);
        setCatalog(providerCatalog);
        const firstClient = connectionList.clients[0];
        if (firstClient) {
          setSelectedTenantId(firstClient.id);
          loadAssignment(firstClient);
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(getRequestError(requestError, "Could not load database configuration."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const selectedClient = clients.find((client) => client.id === selectedTenantId) ?? null;
  const dedicatedCount = clients.filter((client) => client.mode === "DEDICATED").length;
  const connectedCount = clients.filter((client) => client.connection?.status === "CONNECTED").length;
  const selectedProvider = catalog?.providers.find((provider) => provider.id === form.provider) ?? null;
  const maskedPreview = useMemo(() => buildMaskedPreview(form), [form]);

  const loadAssignment = (assignment: ClientDatabaseAssignment) => {
    setIsDedicatedMode(assignment.mode === "DEDICATED");
    setForm(assignment.connection ? formFromConnection(assignment.connection) : emptyForm());
    setShowPassword(false);
    setIsResetConfirming(false);
    setError(null);
    setNotice(null);
  };

  const selectClient = (assignment: ClientDatabaseAssignment) => {
    setSelectedTenantId(assignment.id);
    loadAssignment(assignment);
  };

  const updateProvider = (provider: ClientDatabaseProvider) => {
    setForm((current) => ({
      ...emptyForm(provider),
      displayName: current.displayName || `${providerName(provider)} production`,
      host: current.host,
      databaseName: current.databaseName,
      username: current.username,
      password: current.password
    }));
    setNotice(null);
  };

  const updateField = <Key extends keyof ConnectionForm>(key: Key, value: ConnectionForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice(null);
  };

  const saveConnection = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedClient) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const body: UpsertClientDatabaseConnectionRequest = {
        ...form,
        password: form.password || undefined,
        username: form.username || undefined,
        schemaName: form.schemaName || undefined,
        authSource: form.authSource || undefined,
        replicaSet: form.replicaSet || undefined
      };
      const connection = await api.upsertClientDatabaseConnection(selectedClient.id, body);
      updateClientConnection(selectedClient.id, connection);
      setForm(formFromConnection(connection));
      setIsDedicatedMode(true);
      setNotice("Database configuration saved. Run a connection test before using it for client workloads.");
    } catch (requestError) {
      setError(getRequestError(requestError, "Could not save the database configuration."));
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!selectedClient?.connection) return;
    setIsTesting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.testClientDatabaseConnection(selectedClient.id);
      updateClientConnection(selectedClient.id, result.connection);
      setForm(formFromConnection(result.connection));
      if (result.success) {
        setNotice("Connection successful. The database accepted a live health query.");
      } else {
        setError(result.connection.lastTestMessage ?? "The connection test failed.");
      }
    } catch (requestError) {
      setError(getRequestError(requestError, "Could not run the connection test."));
    } finally {
      setIsTesting(false);
    }
  };

  const resetToShared = async () => {
    if (!selectedClient) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.useSharedClientDatabase(selectedClient.id);
      setClients((current) =>
        current.map((client) =>
          client.id === selectedClient.id ? { ...client, mode: "SHARED", connection: null } : client
        )
      );
      setIsDedicatedMode(false);
      setForm(emptyForm());
      setIsResetConfirming(false);
      setNotice(`${selectedClient.name} now uses the shared platform database.`);
    } catch (requestError) {
      setError(getRequestError(requestError, "Could not restore the shared database assignment."));
    } finally {
      setIsSaving(false);
    }
  };

  const updateClientConnection = (tenantId: string, connection: ClientDatabaseConnection) => {
    setClients((current) =>
      current.map((client) =>
        client.id === tenantId ? { ...client, mode: "DEDICATED", connection } : client
      )
    );
  };

  if (isLoading) {
    return (
      <section className="system-config-state" aria-busy="true">
        <LoaderCircle className="button-spinner" size={24} strokeWidth={2} />
        <div>
          <strong>Loading database assignments</strong>
          <span>Reading encrypted connection metadata from the platform API.</span>
        </div>
      </section>
    );
  }

  if (!catalog || clients.length === 0) {
    return (
      <section className="system-config-state" aria-live="polite">
        <AlertCircle size={24} strokeWidth={2} />
        <div>
          <strong>Database configuration unavailable</strong>
          <span>{error ?? "No client companies are available."}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="page-flow system-configuration" aria-label="Client database configuration">
      <div className="system-summary-grid">
        <SystemSummary icon={Server} label="Client companies" value={clients.length.toString()} detail="Database assignments" />
        <SystemSummary icon={Database} label="Dedicated databases" value={dedicatedCount.toString()} detail={`${clients.length - dedicatedCount} use platform storage`} />
        <SystemSummary icon={CheckCircle2} label="Verified connections" value={connectedCount.toString()} detail="Passed a live health query" />
        <SystemSummary icon={ShieldCheck} label="Credential storage" value="AES-256" detail="GCM encrypted at rest" />
      </div>

      <div className="system-config-layout">
        <aside className="system-client-panel" aria-label="Client database assignments">
          <div className="system-panel-heading">
            <div>
              <p>Assignments</p>
              <h2>Client databases</h2>
            </div>
            <span>{clients.length}</span>
          </div>
          <div className="system-client-list">
            {clients.map((client) => (
              <button
                className="system-client-item"
                data-active={client.id === selectedTenantId}
                key={client.id}
                onClick={() => selectClient(client)}
                type="button"
              >
                <span className="system-client-monogram">{getInitials(client.name)}</span>
                <span className="system-client-copy">
                  <strong>{client.name}</strong>
                  <small>{client.mode === "SHARED" ? "Shared platform" : providerName(client.connection!.provider)}</small>
                </span>
                <ConnectionStatus assignment={client} />
              </button>
            ))}
          </div>
        </aside>

        <section className="system-editor-panel" aria-labelledby="database-editor-title">
          <div className="system-editor-header">
            <div>
              <p>{selectedClient?.slug}</p>
              <h2 id="database-editor-title">{selectedClient?.name}</h2>
              <span>{selectedClient?.dataRegion} data region</span>
            </div>
            <div className="system-mode-control" aria-label="Database assignment mode">
              <button
                data-active={!isDedicatedMode}
                onClick={() => {
                  setIsDedicatedMode(false);
                  setIsResetConfirming(Boolean(selectedClient?.connection));
                }}
                type="button"
              >
                Shared platform
              </button>
              <button
                data-active={isDedicatedMode}
                onClick={() => {
                  setIsDedicatedMode(true);
                  setIsResetConfirming(false);
                }}
                type="button"
              >
                Dedicated database
              </button>
            </div>
          </div>

          {error && (
            <div className="system-message" data-tone="error" role="alert">
              <AlertCircle size={18} strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="system-message" data-tone="success" role="status">
              <CheckCircle2 size={18} strokeWidth={2} />
              <span>{notice}</span>
            </div>
          )}

          {!isDedicatedMode ? (
            <div className="shared-database-view">
              <span className="shared-database-icon"><Database size={26} strokeWidth={1.8} /></span>
              <div>
                <h3>Shared platform database</h3>
                <p>
                  This client uses the EsteemedEngineering platform database with tenant-scoped records and role-based access.
                </p>
              </div>
              {isResetConfirming ? (
                <div className="reset-confirmation">
                  <p>This removes the saved dedicated connection metadata. It does not delete the client database.</p>
                  <div>
                    <Button className="secondary-button" disabled={isSaving} onClick={() => setIsResetConfirming(false)} type="button" variant="outline">
                      Keep dedicated
                    </Button>
                    <Button className="danger-button" disabled={isSaving} onClick={resetToShared} type="button">
                      {isSaving ? <LoaderCircle className="button-spinner" size={17} /> : <RotateCcw size={17} />}
                      <span>Use shared database</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="primary-button" onClick={() => setIsDedicatedMode(true)} type="button">
                  <Server size={17} strokeWidth={2} />
                  <span>Configure dedicated database</span>
                </Button>
              )}
            </div>
          ) : (
            <form className="database-connection-form" onSubmit={saveConnection}>
              <div className="database-form-intro">
                <div>
                  <h3>Connection profile</h3>
                  <p>Credentials are encrypted before storage and are never returned by the API.</p>
                </div>
                {selectedClient?.connection && <ConnectionHealth connection={selectedClient.connection} />}
              </div>

              <div className="database-form-grid">
                <label className="form-field">
                  <span>Provider</span>
                  <SelectMenu
                    ariaLabel="Database provider"
                    onChange={updateProvider}
                    options={catalog.providers.map((provider) => ({
                      description: provider.notes,
                      label: provider.name,
                      value: provider.id
                    }))}
                    value={form.provider}
                  />
                </label>
                <label className="form-field">
                  <span>Connection name</span>
                  <Input maxLength={80} onChange={(event) => updateField("displayName", event.target.value)} required value={form.displayName} />
                </label>
              </div>

              {selectedProvider && (
                <div className="provider-guidance">
                  <Database size={18} strokeWidth={2} />
                  <div>
                    <strong>{selectedProvider.name}</strong>
                    <span>{selectedProvider.notes}</span>
                  </div>
                  {selectedProvider.id === catalog.recommendation.provider && <span className="recommended-label">Recommended</span>}
                </div>
              )}

              <div className="database-form-grid">
                <label className="form-field form-field-wide">
                  <span>Host</span>
                  <Input onChange={(event) => updateField("host", event.target.value)} placeholder="db.example.com" required value={form.host} />
                  <small>Hostname only, without protocol, path, or port.</small>
                </label>
                <label className="form-field">
                  <span>Port</span>
                  <Input max={65535} min={1} onChange={(event) => updateField("port", Number(event.target.value))} required type="number" value={form.port} />
                </label>
                <label className="form-field">
                  <span>Database name</span>
                  <Input maxLength={128} onChange={(event) => updateField("databaseName", event.target.value)} required value={form.databaseName} />
                </label>
                <label className="form-field">
                  <span>Username{form.provider === "MONGODB" ? " (optional)" : ""}</span>
                  <Input autoComplete="off" maxLength={128} onChange={(event) => updateField("username", event.target.value)} required={form.provider !== "MONGODB"} value={form.username} />
                </label>
                <label className="form-field">
                  <span>Password{selectedClient?.connection?.hasPassword ? " (leave blank to keep)" : ""}</span>
                  <span className="password-input-shell">
                    <Input autoComplete="new-password" onChange={(event) => updateField("password", event.target.value)} required={form.provider !== "MONGODB" && !selectedClient?.connection?.hasPassword} type={showPassword ? "text" : "password"} value={form.password} />
                    <button aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)} title={showPassword ? "Hide password" : "Show password"} type="button">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>
                <label className="form-field">
                  <span>SSL / TLS mode</span>
                  <SelectMenu<ClientDatabaseSslMode>
                    ariaLabel="SSL and TLS mode"
                    onChange={(value) => updateField("sslMode", value)}
                    options={[
                      { label: "Verify certificate and host", value: "VERIFY_FULL" },
                      { label: "Verify certificate authority", value: "VERIFY_CA" },
                      { label: "Encrypt without verification", value: "REQUIRE" },
                      { label: "Disable TLS", value: "DISABLE" }
                    ]}
                    value={form.sslMode}
                  />
                </label>

                {form.provider === "SUPABASE" && (
                  <label className="form-field">
                    <span>Supabase connection mode</span>
                    <SelectMenu<ClientDatabaseConnectionMode>
                      ariaLabel="Supabase connection mode"
                      onChange={(value) => updateField("connectionMode", value)}
                      options={[
                        { description: "Persistent backend with IPv6 connectivity", label: "Direct connection", value: "DIRECT" },
                        { description: "Persistent backend with IPv4-compatible pooling", label: "Session pooler", value: "SESSION_POOLER" },
                        { description: "Short-lived serverless workloads", label: "Transaction pooler", value: "TRANSACTION_POOLER" }
                      ]}
                      value={form.connectionMode}
                    />
                  </label>
                )}

                {(form.provider === "POSTGRESQL" || form.provider === "SUPABASE") && (
                  <label className="form-field">
                    <span>Schema</span>
                    <Input maxLength={63} onChange={(event) => updateField("schemaName", event.target.value)} value={form.schemaName} />
                  </label>
                )}

                {form.provider === "MONGODB" && (
                  <>
                    <label className="form-field">
                      <span>Authentication database</span>
                      <Input maxLength={128} onChange={(event) => updateField("authSource", event.target.value)} value={form.authSource} />
                    </label>
                    <label className="form-field">
                      <span>Replica set (optional)</span>
                      <Input maxLength={128} onChange={(event) => updateField("replicaSet", event.target.value)} value={form.replicaSet} />
                    </label>
                    <label className="mongodb-srv-field">
                      <Checkbox checked={Boolean(form.useSrv)} onCheckedChange={(checked) => updateField("useSrv", checked === true)} />
                      <span>
                        <strong>Use DNS SRV discovery</strong>
                        <small>Recommended for MongoDB Atlas clusters.</small>
                      </span>
                    </label>
                  </>
                )}
              </div>

              <div className="connection-preview">
                <span>Masked connection preview</span>
                <code>{maskedPreview}</code>
              </div>

              <div className="database-form-actions">
                {selectedClient?.connection && (
                  <Button className="secondary-button" disabled={isSaving || isTesting} onClick={testConnection} type="button" variant="outline">
                    {isTesting ? <LoaderCircle className="button-spinner" size={17} /> : <PlugZap size={17} />}
                    <span>{isTesting ? "Testing connection" : "Test saved connection"}</span>
                  </Button>
                )}
                <Button className="primary-button" disabled={isSaving || isTesting} type="submit">
                  {isSaving ? <LoaderCircle className="button-spinner" size={17} /> : <Save size={17} />}
                  <span>{isSaving ? "Saving configuration" : "Save configuration"}</span>
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </section>
  );
}

function SystemSummary({ icon: Icon, label, value, detail }: { icon: typeof Database; label: string; value: string; detail: string }) {
  return (
    <div className="system-summary-item">
      <span><Icon size={19} strokeWidth={2} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function ConnectionStatus({ assignment }: { assignment: ClientDatabaseAssignment }) {
  if (assignment.mode === "SHARED") return <span className="connection-dot" data-status="SHARED" title="Shared platform database" />;
  return <span className="connection-dot" data-status={assignment.connection?.status} title={assignment.connection?.status.replace(/_/g, " ")} />;
}

function ConnectionHealth({ connection }: { connection: ClientDatabaseConnection }) {
  return (
    <div className="connection-health" data-status={connection.status}>
      <span className="connection-dot" data-status={connection.status} />
      <div>
        <strong>{connection.status === "CONNECTED" ? "Connected" : connection.status === "FAILED" ? "Test failed" : "Not tested"}</strong>
        <small>{connection.lastTestedAt ? `Tested ${formatTimestamp(connection.lastTestedAt)}` : "No live test recorded"}</small>
      </div>
    </div>
  );
}

function formFromConnection(connection: ClientDatabaseConnection): ConnectionForm {
  return {
    provider: connection.provider,
    displayName: connection.displayName,
    host: connection.host,
    port: connection.port,
    databaseName: connection.databaseName,
    username: connection.username ?? "",
    password: "",
    sslMode: connection.sslMode,
    connectionMode: connection.connectionMode,
    schemaName: connection.schemaName ?? "",
    authSource: connection.authSource ?? "",
    replicaSet: connection.replicaSet ?? "",
    useSrv: connection.useSrv
  };
}

function buildMaskedPreview(form: ConnectionForm): string {
  const username = form.username ? `${encodeURIComponent(form.username)}:********@` : "";
  const host = form.host || "db.example.com";
  const database = encodeURIComponent(form.databaseName || "database");
  if (form.provider === "MONGODB") {
    return `${form.useSrv ? "mongodb+srv" : "mongodb"}://${username}${host}${form.useSrv ? "" : `:${form.port}`}/${database}`;
  }
  return `${form.provider === "MYSQL" ? "mysql" : "postgresql"}://${username}${host}:${form.port}/${database}`;
}

function providerName(provider: ClientDatabaseProvider): string {
  return { POSTGRESQL: "PostgreSQL", SUPABASE: "Supabase Postgres", MYSQL: "MySQL", MONGODB: "MongoDB" }[provider];
}

function getInitials(value: string): string {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getRequestError(error: unknown, fallback: string): string {
  if (!(error instanceof PeptraceApiError)) return fallback;
  if (error.payload && typeof error.payload === "object" && "message" in error.payload) {
    const message = (error.payload as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }
  return fallback;
}
