// Public catalog responses are cached in-process. Admin writes call
// notifyCatalogChanged() so the next public read is rebuilt from the database.
// Each API instance keeps its own cache, so with several replicas only the one
// that handled the write is refreshed immediately; the others expire on TTL.
const listeners = new Set<() => void>();

export const onCatalogChanged = (listener: () => void): void => {
  listeners.add(listener);
};

export const notifyCatalogChanged = (): void => {
  for (const listener of listeners) listener();
};
