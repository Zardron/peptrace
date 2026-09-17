import crypto from 'node:crypto';

// ---- Password hashing (scrypt) ----
// Format: scrypt$N$r$p$<salt b64>$<hash b64>

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${hash.toString('base64')}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return crypto.timingSafeEqual(actual, expected);
};

// ---- Session tokens (HS256 JWT) ----
// Signed with AUTH_SESSION_SECRET so the API can authenticate native users
// without involving Supabase Auth.

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface NativeSession {
  userId: string;
  email: string;
}

const base64url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64url');

const sign = (data: string, secret: string): string =>
  crypto.createHmac('sha256', secret).update(data).digest('base64url');

export const createSessionToken = (session: NativeSession, secret: string): string => {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      sub: session.userId,
      email: session.email,
      peptrace: 'native',
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
    }),
  );
  const body = `${header}.${payload}`;
  return `${body}.${sign(body, secret)}`;
};

export const verifySessionToken = (token: string, secret: string): NativeSession | null => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const body = `${parts[0]}.${parts[1]}`;
  const expected = sign(body, secret);
  const actual = parts[2];
  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (
      payload?.peptrace !== 'native' ||
      typeof payload?.sub !== 'string' ||
      typeof payload?.email !== 'string' ||
      typeof payload?.exp !== 'number' ||
      payload.exp * 1000 < Date.now()
    ) {
      return null;
    }
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
};

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
