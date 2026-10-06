import {
  has,
  optionalNumber,
  optionalText,
  optionalUrl,
  requiredDate,
  requiredNumber,
  requiredText,
  ValidationError,
} from './admin-input.js';

export const LAB_REPORT_UPLOAD_TYPE = 'lab-report';
const SHIPMENT_STATUSES = ['submitted', 'in_transit', 'testing', 'delivered'];

export const isStoragePath = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && !value.includes('://') && !value.includes('..');

const listOf = (value: unknown, label: string, max: number): Record<string, unknown>[] => {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value) || value.length > max) throw new ValidationError(`${label} must be a list of up to ${max} items`);
  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new ValidationError(`${label} item ${index + 1} is invalid`);
    return item as Record<string, unknown>;
  });
};

const parseMilestones = (value: unknown) => listOf(value, 'Milestones', 12).map((item, index) => ({
  name: requiredText(item.name, `Milestone ${index + 1} name`, 80),
  date: optionalText(item.date, `Milestone ${index + 1} date`, 40) ?? '',
  completed: item.completed === true,
}));

const parseTimeline = (value: unknown) => listOf(value, 'Timeline', 100).map((item, index) => ({
  event: requiredText(item.event, `Timeline event ${index + 1}`, 160),
  meta: optionalText(item.meta, `Timeline event ${index + 1} details`, 300) ?? '',
  timestamp: optionalText(item.timestamp, `Timeline event ${index + 1} time`, 40) ?? '',
}));

const parseBillingItems = (value: unknown) => listOf(value, 'Billing items', 30).map((item, index) => ({
  label: requiredText(item.label, `Billing item ${index + 1} label`, 120),
  value: requiredNumber(item.value, `Billing item ${index + 1} amount`, -1_000_000, 1_000_000),
}));

const TEXT_FIELDS: Array<[string, string, string, number]> = [
  ['originCity', 'origin_city', 'Origin city', 120],
  ['originAddress', 'origin_address', 'Origin address', 300],
  ['destinationCity', 'destination_city', 'Destination city', 120],
  ['destinationAddress', 'destination_address', 'Destination address', 300],
  ['service', 'service', 'Service', 80],
  ['packageType', 'package_type', 'Package type', 80],
  ['weight', 'weight', 'Weight', 40],
  ['dimensions', 'dimensions', 'Dimensions', 80],
  ['temperature', 'temperature', 'Temperature', 80],
  ['invoiceNumber', 'invoice_number', 'Invoice number', 60],
  ['paymentStatus', 'payment_status', 'Payment status', 40],
  ['paymentMethod', 'payment_method', 'Payment method', 80],
  ['dueDate', 'due_date', 'Due date', 40],
  ['paymentNoticeTitle', 'payment_notice_title', 'Payment notice title', 120],
  ['paymentNoticeBody', 'payment_notice_body', 'Payment notice', 1000],
];

export const shipmentValues = (body: Record<string, unknown>): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  for (const [key, column, label, max] of TEXT_FIELDS) {
    if (has(body, key)) values[column] = optionalText(body[key], label, max);
  }
  if (has(body, 'status')) {
    if (!SHIPMENT_STATUSES.includes(String(body.status))) throw new ValidationError('Choose a valid shipment status');
    values.status = body.status;
  }
  if (has(body, 'invoiceUrl')) values.invoice_url = optionalUrl(body.invoiceUrl, 'Invoice link');
  if (has(body, 'totalAmount')) values.total_amount = optionalNumber(body.totalAmount, 'Total amount', 0, 10_000_000);
  if (has(body, 'amountDue')) values.amount_due = optionalNumber(body.amountDue, 'Amount due', 0, 10_000_000);
  if (has(body, 'milestones')) values.milestones = parseMilestones(body.milestones);
  if (has(body, 'timelineEvents')) values.timeline_events = parseTimeline(body.timelineEvents);
  if (has(body, 'billingItems')) values.billing_items = parseBillingItems(body.billingItems);
  return values;
};

const resultCoa = (value: unknown, accountId: string): string | null => {
  const text = optionalText(value, 'COA', 2000);
  if (!text) return null;
  if (isStoragePath(text)) {
    if (!text.startsWith(`${accountId}/${LAB_REPORT_UPLOAD_TYPE}/`)) {
      throw new ValidationError('The uploaded report does not belong to this shipment');
    }
    return text;
  }
  return optionalUrl(text, 'COA link');
};

export const resultValues = (body: Record<string, unknown>, accountId: string, partial: boolean): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  if (!partial || has(body, 'outcome')) {
    if (!['pass', 'fail'].includes(String(body.outcome))) throw new ValidationError('Result must be pass or fail');
    values.outcome = body.outcome;
    values.result = body.outcome;
  }
  if (!partial || has(body, 'purity')) values.purity = requiredNumber(body.purity, 'Purity', 0, 100);
  if (!partial || has(body, 'testedAt')) values.tested_at = requiredDate(body.testedAt, 'Test date');
  if (!partial || has(body, 'batchCode')) values.batch_code = optionalText(body.batchCode, 'Batch code', 120);
  if (!partial || has(body, 'labName')) values.lab_name = optionalText(body.labName, 'Lab', 120);
  if (!partial || has(body, 'dosageDeviation')) values.dosage_deviation = optionalText(body.dosageDeviation, 'Dosage deviation', 40);
  if (!partial || has(body, 'testedMg')) values.tested_mg = optionalNumber(body.testedMg, 'Tested mg', 0, 999_999);
  if (!partial || has(body, 'labelMg')) values.label_mg = optionalNumber(body.labelMg, 'Label mg', 0, 999_999);
  if (!partial || has(body, 'batchInfo')) values.batch_info = optionalText(body.batchInfo, 'Batch details', 500);
  if (!partial || has(body, 'sender')) values.sender = optionalText(body.sender, 'Sender', 120);
  if (!partial || has(body, 'coaUrl')) values.coa_url = resultCoa(body.coaUrl, accountId);
  return values;
};
