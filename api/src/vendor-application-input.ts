import { optionalUrl, ValidationError } from './admin-input.js';
import { isValidEmail } from './auth.js';

export const VENDOR_SITUATIONS = ['new', 'selling-unlisted', 'selling-listed'] as const;
export const BATCH_IDENTIFIER_OPTIONS = ['all', 'some', 'no'] as const;
export const APPLICATION_STATUSES = ['new', 'contacted', 'approved', 'rejected'] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const oneOf = <T extends string>(value: unknown, options: readonly T[], message: string): T => {
  if (typeof value !== 'string' || !(options as readonly string[]).includes(value)) throw new ValidationError(message);
  return value as T;
};

export const applicationValues = (body: Record<string, unknown>) => {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email) || email.length > 254) throw new ValidationError('Enter a valid email address');
  const vendorName = typeof body.vendorName === 'string' ? body.vendorName.trim() : '';
  if (!vendorName) throw new ValidationError('Vendor name is required');
  if (vendorName.length > 120) throw new ValidationError('Vendor name must be 120 characters or fewer');
  if (typeof body.distributesCommercially !== 'boolean') {
    throw new ValidationError('Tell us whether you distribute peptides commercially');
  }
  if (body.termsAccepted !== true) throw new ValidationError('Confirm that you are authorized to represent this vendor');
  const rawWebsite = typeof body.websiteUrl === 'string' ? body.websiteUrl.trim() : body.websiteUrl;
  const websiteUrl = optionalUrl(
    typeof rawWebsite === 'string' && rawWebsite && !/^[a-z][a-z0-9+.-]*:/i.test(rawWebsite) ? `https://${rawWebsite}` : rawWebsite,
    'Website',
  );
  if (websiteUrl?.startsWith('mailto:')) throw new ValidationError('Website must be an http(s) link');
  if (websiteUrl && websiteUrl.length > 500) throw new ValidationError('Website must be 500 characters or fewer');
  return {
    email,
    vendor_name: vendorName,
    website_url: websiteUrl,
    distributes_commercially: body.distributesCommercially,
    situation: oneOf(body.situation, VENDOR_SITUATIONS, 'Choose your current situation'),
    batch_identifiers: body.batchIdentifiers === undefined || body.batchIdentifiers === null || body.batchIdentifiers === ''
      ? null
      : oneOf(body.batchIdentifiers, BATCH_IDENTIFIER_OPTIONS, 'Choose whether your products carry batch identifiers'),
    premium_interest: body.premiumInterest === true,
  };
};

export const reviewValues = (body: Record<string, unknown>) => {
  const values: Record<string, unknown> = {};
  if ('status' in body) values.status = oneOf(body.status, APPLICATION_STATUSES, 'Choose a valid status');
  if ('adminNote' in body) {
    const note = typeof body.adminNote === 'string' ? body.adminNote.trim() : '';
    if (note.length > 2000) throw new ValidationError('Note must be 2000 characters or fewer');
    values.admin_note = note || null;
  }
  if ('vendorId' in body) {
    if (body.vendorId !== null && (typeof body.vendorId !== 'string' || !body.vendorId)) throw new ValidationError('Invalid vendor');
    values.vendor_id = body.vendorId;
  }
  if (!Object.keys(values).length) throw new ValidationError('Nothing to update');
  return values;
};
