import type { NextFunction, Request, Response } from 'express';
import type { AdminPermission, AdminRole } from './admin-policy.js';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export interface AuditDetails {
  actor?: { id: string; email: string } | null;
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminRouteDeps {
  actor: (req: Request) => { id: string; email: string; role: AdminRole };
  audit: (req: Request, details: AuditDetails) => Promise<boolean>;
  requireAuditRecord: (req: Request, res: Response, details: AuditDetails) => Promise<boolean>;
  requirePermission: (permission: AdminPermission) => Middleware;
}

export class ValidationError extends Error {}

export const has = (body: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(body, key);

export const optionalText = (value: unknown, label: string, maxLength: number): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new ValidationError(`${label} must be text`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new ValidationError(`${label} must be ${maxLength} characters or fewer`);
  return trimmed || null;
};

export const requiredText = (value: unknown, label: string, maxLength: number): string => {
  const text = optionalText(value, label, maxLength);
  if (!text) throw new ValidationError(`${label} is required`);
  return text;
};

export const optionalNumber = (value: unknown, label: string, min: number, max: number): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ValidationError(`${label} must be a number between ${min} and ${max}`);
  }
  return parsed;
};

export const requiredNumber = (value: unknown, label: string, min: number, max: number): number => {
  const parsed = optionalNumber(value, label, min, max);
  if (parsed === null) throw new ValidationError(`${label} is required`);
  return parsed;
};

export const optionalUrl = (value: unknown, label: string): string | null => {
  const text = optionalText(value, label, 2000);
  if (!text) return null;
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new ValidationError(`${label} must be a full URL`);
  }
  if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
    throw new ValidationError(`${label} must start with https://, http:// or mailto:`);
  }
  return text;
};

export const requiredDate = (value: unknown, label: string): string => {
  const text = requiredText(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) {
    throw new ValidationError(`${label} must be a date (YYYY-MM-DD)`);
  }
  return text;
};

export const sendError = (
  res: Response,
  error: unknown,
  fallback: string,
  duplicateMessage = 'A record with that name or slug already exists',
): void => {
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  const code = (error as { code?: string })?.code;
  if (code === '23505') {
    res.status(409).json({ error: duplicateMessage });
    return;
  }
  if (code === '23503') {
    res.status(409).json({ error: 'This record is still referenced by customer shipments. Hide it instead of deleting it.' });
    return;
  }
  if (code === '23502') {
    res.status(400).json({ error: 'A required field is missing' });
    return;
  }
  res.status(500).json({ error: fallback });
};

export const reasonFrom = (req: Request): string => {
  const value = req.body?.reason ?? req.query.reason;
  return typeof value === 'string' ? value.trim().slice(0, 500) : '';
};

export const bodyOf = (req: Request): Record<string, unknown> =>
  req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
