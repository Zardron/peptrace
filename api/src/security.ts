import type { Request } from 'express';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

// Express resolves req.ip from the right-most untrusted hop according to the
// configured trust-proxy count. Never use the first X-Forwarded-For value: a
// client can supply it and rotate it to bypass throttling.
export const trustedClientAddress = (req: Pick<Request, 'ip' | 'socket'>): string =>
  req.ip || req.socket.remoteAddress || 'unknown';

export const normalizeAdminSearch = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') return null;
  const normalized = value.trim().slice(0, 100);
  return /^[a-zA-Z0-9@.+\-\s]*$/.test(normalized) ? normalized : null;
};

export type SafeUploadType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

export const detectUploadType = (buffer: Buffer): SafeUploadType | null => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }
  return null;
};

export const extensionForUploadType = (contentType: SafeUploadType): string => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
})[contentType];

interface SessionStore {
  from(table: string): {
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): {
        is(column: string, value: null): PromiseLike<{ error: unknown }>;
      };
    };
  };
}

export const revokeAllOwnedSessions = (
  db: SessionStore,
  kind: 'customer' | 'admin',
  ownerId: string,
  revokedAt: string,
): PromiseLike<{ error: unknown }> => db
  .from(kind === 'customer' ? 'customer_sessions' : 'admin_sessions')
  .update({ revoked_at: revokedAt })
  .eq(kind === 'customer' ? 'user_id' : 'admin_user_id', ownerId)
  .is('revoked_at', null);
