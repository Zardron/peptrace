export const SHIPMENT_ADDONS = {
  'different-lab': { id: 'different-lab', title: 'Choose a different lab', price: 49.99, amountCents: 4999 },
  endotoxin: { id: 'endotoxin', title: 'Endotoxin', price: 49, amountCents: 4900 },
  'heavy-metals': { id: 'heavy-metals', title: 'Heavy metals (Pb, Cd, As, Hg)', price: 120, amountCents: 12000 },
  solvents: { id: 'solvents', title: 'Solvents', price: 120, amountCents: 12000 },
} as const;

export const DIFFERENT_LAB_OPTIONS = ['ABC Labs', 'XYZ Labs', 'Global Lab'] as const;

export type ShipmentAddon = (typeof SHIPMENT_ADDONS)[keyof typeof SHIPMENT_ADDONS];

export const isValidAddonLab = (addons: ShipmentAddon[], lab: unknown): boolean =>
  !addons.some((addon) => addon.id === 'different-lab') ||
  (typeof lab === 'string' && (DIFFERENT_LAB_OPTIONS as readonly string[]).includes(lab));

export const parseShipmentAddons = (value: unknown): ShipmentAddon[] | null => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((id) => typeof id !== 'string')) return null;
  const ids = value as string[];
  if (new Set(ids).size !== ids.length) return null;
  const addons = ids.map((id) => SHIPMENT_ADDONS[id as keyof typeof SHIPMENT_ADDONS]);
  return addons.some((addon) => !addon) ? null : addons;
};

export const shipmentAddonAmountCents = (addons: ShipmentAddon[]): number =>
  addons.reduce((total, addon) => total + addon.amountCents, 0);
