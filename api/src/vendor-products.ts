import type { SupabaseClient } from '@supabase/supabase-js';
import {
  has,
  optionalNumber,
  optionalText,
  optionalUrl,
  requiredText,
  ValidationError,
} from './admin-input.js';
import { isUuid } from './security.js';

export const VENDOR_PRODUCT_COLUMNS =
  'id, vendor_id, peptide_id, name, peptide_name, amount_mg, price_usd, product_url, description, in_stock, created_at, updated_at';

export const vendorProductValues = (body: Record<string, unknown>, partial: boolean): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  if (!partial || has(body, 'amountMg')) values.amount_mg = optionalNumber(body.amountMg, 'Amount (mg)', 0.01, 999999);
  if (!partial || has(body, 'priceUsd')) values.price_usd = optionalNumber(body.priceUsd, 'Price', 0, 1000000);
  if (!partial || has(body, 'productUrl')) {
    const url = optionalUrl(body.productUrl, 'Product link');
    if (url && url.startsWith('mailto:')) throw new ValidationError('Product link must start with https:// or http://');
    values.product_url = url;
  }
  if (!partial || has(body, 'description')) values.description = optionalText(body.description, 'Description', 2000);
  if (!partial || has(body, 'inStock')) values.in_stock = body.inStock !== false;
  return values;
};

// The product is named after its peptide. Unknown peptides are created with the given status.
export const resolveProductPeptide = async (
  db: SupabaseClient,
  body: Record<string, unknown>,
  newStatus: 'listed' | 'pending_approval',
): Promise<{ name: string; peptide_name: string; peptide_id: string }> => {
  if (isUuid(body.peptideId)) {
    const { data } = await db.from('peptides').select('id, name').eq('id', body.peptideId).eq('status', 'listed').maybeSingle();
    if (data) return { name: data.name, peptide_name: data.name, peptide_id: data.id };
  }

  const name = requiredText(body.peptideName, 'Peptide', 120);
  const pattern = name.replace(/[\\%_]/g, (character) => `\\${character}`);
  const { data: existing } = await db.from('peptides').select('id, name').ilike('name', pattern).limit(1).maybeSingle();
  if (existing) return { name: existing.name, peptide_name: existing.name, peptide_id: existing.id };

  const { data: created, error } = await db.from('peptides')
    .insert({ name, status: newStatus, testing_price: 0 })
    .select('id, name')
    .single();
  if (error || !created) throw error ?? new Error('peptide_insert_failed');
  return { name: created.name, peptide_name: created.name, peptide_id: created.id };
};

export const toVendorProduct = (row: Record<string, any>) => ({
  id: row.id,
  vendorId: row.vendor_id,
  peptideId: row.peptide_id ?? null,
  name: row.name,
  peptideName: row.peptide_name ?? row.name,
  amountMg: row.amount_mg == null ? null : Number(row.amount_mg),
  priceUsd: row.price_usd == null ? null : Number(row.price_usd),
  productUrl: row.product_url,
  description: row.description,
  inStock: row.in_stock === true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
