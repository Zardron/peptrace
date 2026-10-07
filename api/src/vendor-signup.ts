export const VENDOR_SITUATIONS = ['new', 'selling-unlisted', 'selling-listed'] as const;
export const BATCH_IDENTIFIER_OPTIONS = ['all', 'some', 'no'] as const;

export type VendorSignupApplicationInput = {
  distributesPeptides: boolean;
  currentSituation: (typeof VENDOR_SITUATIONS)[number];
  vendorName: string;
  batchIdentifiers: (typeof BATCH_IDENTIFIER_OPTIONS)[number] | null;
  premiumOptIn: boolean;
};

type VendorSignupParseResult =
  | { data: VendorSignupApplicationInput }
  | { error: string };

export const parseVendorSignupApplication = (body: unknown): VendorSignupParseResult => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Application details are required' };
  }

  const input = body as Record<string, unknown>;
  const vendorName = typeof input.vendorName === 'string' ? input.vendorName.trim() : '';
  if (vendorName.length < 2 || vendorName.length > 120) {
    return { error: 'Vendor name must be 2-120 characters' };
  }
  if (typeof input.distributesPeptides !== 'boolean') {
    return { error: 'Select whether you distribute peptides commercially' };
  }
  if (!VENDOR_SITUATIONS.includes(input.currentSituation as (typeof VENDOR_SITUATIONS)[number])) {
    return { error: 'Select your current situation' };
  }
  if (input.batchIdentifiers !== null &&
      !BATCH_IDENTIFIER_OPTIONS.includes(input.batchIdentifiers as (typeof BATCH_IDENTIFIER_OPTIONS)[number])) {
    return { error: 'Select a valid batch identifier option' };
  }
  if (typeof input.premiumOptIn !== 'boolean') {
    return { error: 'Select a valid premium preference' };
  }
  if (input.termsAccepted !== true) {
    return { error: 'Accept the Partner Service Terms to apply' };
  }

  return {
    data: {
      distributesPeptides: input.distributesPeptides,
      currentSituation: input.currentSituation as (typeof VENDOR_SITUATIONS)[number],
      vendorName,
      batchIdentifiers: input.batchIdentifiers as VendorSignupApplicationInput['batchIdentifiers'],
      premiumOptIn: input.premiumOptIn,
    },
  };
};