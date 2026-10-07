import { ValidationError } from './admin-input.js';

export type FieldSpec =
  | { type: 'text'; label: string; max: number; optional?: boolean; multiline?: boolean; hint?: string }
  | { type: 'href'; label: string; optional?: boolean; hint?: string }
  | { type: 'email'; label: string }
  | { type: 'boolean'; label: string; hint?: string }
  | { type: 'choice'; label: string; options: Array<{ value: string; label: string }> }
  | { type: 'list'; label: string; max: number; min?: number; item: FieldSpec; itemLabel: string; hint?: string }
  | { type: 'group'; label: string; fields: Record<string, FieldSpec>; hint?: string };

export interface ContentBlock {
  key: string;
  title: string;
  description: string;
  path: string;
  spec: Extract<FieldSpec, { type: 'group' }>;
  check?: (content: Record<string, unknown>) => string | null;
}

const text = (label: string, max: number, extra: Partial<Extract<FieldSpec, { type: 'text' }>> = {}): FieldSpec =>
  ({ type: 'text', label, max, ...extra });
const longText = (label: string, max: number, extra: Partial<Extract<FieldSpec, { type: 'text' }>> = {}): FieldSpec =>
  text(label, max, { multiline: true, ...extra });
const paragraphs = (label: string, max: number, itemLabel = 'Paragraph'): FieldSpec =>
  ({ type: 'list', label, max, item: longText(itemLabel, 3000), itemLabel });
const link = (label: string, max = 20): FieldSpec => ({
  type: 'list',
  label,
  max,
  itemLabel: 'Link',
  item: { type: 'group', label: 'Link', fields: { label: text('Label', 80), href: { type: 'href', label: 'Link to' } } },
});

const legalSpec = (): ContentBlock['spec'] => ({
  type: 'group',
  label: 'Document',
  fields: {
    title: text('Page title', 120),
    lastUpdated: text('Last updated', 40, { hint: 'Shown as "Last updated: …". Change it whenever the policy changes.' }),
    intro: paragraphs('Introduction', 10),
    sections: {
      type: 'list',
      label: 'Sections',
      max: 40,
      itemLabel: 'Section',
      item: {
        type: 'group',
        label: 'Section',
        fields: {
          heading: text('Heading', 160),
          paragraphs: paragraphs('Paragraphs', 20),
          list: { type: 'list', label: 'Bullet points', max: 30, item: longText('Bullet', 1000), itemLabel: 'Bullet' },
        },
      },
    },
  },
});

export const CONTENT_BLOCKS: ContentBlock[] = [
  {
    key: 'announcement',
    title: 'Announcement bar',
    description: 'Optional bar at the top of every page for launches, outages or policy changes.',
    path: '/',
    check: (content) => (content.enabled && !content.text ? 'Add a message to show the announcement bar' : null),
    spec: {
      type: 'group',
      label: 'Announcement',
      fields: {
        enabled: { type: 'boolean', label: 'Show the announcement bar' },
        text: text('Message', 200, { optional: true }),
        href: { type: 'href', label: 'Link (optional)', optional: true },
        tone: {
          type: 'choice',
          label: 'Style',
          options: [
            { value: 'info', label: 'Information (green)' },
            { value: 'warning', label: 'Warning (amber)' },
          ],
        },
      },
    },
  },
  {
    key: 'home',
    title: 'Home page',
    description: 'The top banner, the legal disclaimer and the newsletter note on the home page.',
    path: '/',
    spec: {
      type: 'group',
      label: 'Home page',
      fields: {
        bannerText: text('Top banner text', 120),
        bannerHref: { type: 'href', label: 'Top banner link' },
        disclaimerTitle: text('Disclaimer heading', 120),
        disclaimer: longText('Disclaimer', 5000),
        newsletterTitle: text('Newsletter heading', 120),
        newsletterNotes: paragraphs('Newsletter notes', 5, 'Note'),
      },
    },
  },
  {
    key: 'footer',
    title: 'Footer',
    description: 'Link columns and copyright line shown at the bottom of every page.',
    path: '/',
    spec: {
      type: 'group',
      label: 'Footer',
      fields: {
        columns: {
          type: 'list',
          label: 'Columns',
          max: 5,
          itemLabel: 'Column',
          item: { type: 'group', label: 'Column', fields: { title: text('Column title', 60), links: link('Links') } },
        },
        copyright: text('Copyright line', 120),
      },
    },
  },
  {
    key: 'membership',
    title: 'Membership page',
    description: 'Plans and prices, benefits, funding note and FAQ on the membership page.',
    path: '/membership',
    spec: {
      type: 'group',
      label: 'Membership',
      fields: {
        heroTitle: text('Headline', 120),
        heroHighlight: text('Headline highlight', 80, { hint: 'Shown in green after the headline.' }),
        heroBody: longText('Intro', 600),
        plans: {
          type: 'list',
          label: 'Plans',
          min: 1,
          max: 4,
          itemLabel: 'Plan',
          item: {
            type: 'group',
            label: 'Plan',
            fields: {
              title: text('Plan name', 60),
              tone: {
                type: 'choice',
                label: 'Style',
                options: [
                  { value: 'muted', label: 'Free (grey, sign-up button)' },
                  { value: 'member', label: 'Member (green)' },
                  { value: 'gold', label: 'Gold' },
                ],
              },
              price: text('Price', 20),
              period: text('Billing period', 30),
              badge: text('Badge', 30, { optional: true }),
              description: longText('Description', 300),
              features: { type: 'list', label: 'Features', max: 10, item: text('Feature', 120), itemLabel: 'Feature' },
            },
          },
        },
        policyText: text('Policy line under the plans', 200),
        supportEmail: { type: 'email', label: 'Support email' },
        highlights: {
          type: 'list',
          label: 'Benefits',
          max: 3,
          itemLabel: 'Benefit',
          hint: 'Icons follow the order: COA, rating modes, intelligence reports.',
          item: { type: 'group', label: 'Benefit', fields: { title: text('Title', 80), description: longText('Description', 400) } },
        },
        fundingTitle: text('Funding heading', 120),
        fundingBody: longText('Funding text', 1000),
        fundingStatTitle: text('Funding highlight', 40),
        fundingStatBody: text('Funding highlight note', 200),
        faqTitle: text('FAQ heading', 120),
        faqs: {
          type: 'list',
          label: 'Questions',
          max: 20,
          itemLabel: 'Question',
          item: { type: 'group', label: 'Question', fields: { question: text('Question', 200), answer: longText('Answer', 1500) } },
        },
      },
    },
  },
  {
    key: 'methodology',
    title: 'Methodology page',
    description: 'The data freshness line, introduction and passing-standards table. Scoring formulas stay in code because they describe how ratings are calculated.',
    path: '/methodology',
    spec: {
      type: 'group',
      label: 'Methodology',
      fields: {
        updatedLabel: text('Data freshness line', 120, { hint: 'e.g. TEST DATA LAST UPDATED 14 SEPT 2025, 19,448 TESTS' }),
        intro: longText('Introduction', 1500),
        standardsIntro: longText('Standards introduction', 1000),
        standards: {
          type: 'list',
          label: 'Passing standards',
          max: 10,
          itemLabel: 'Standard',
          item: {
            type: 'group',
            label: 'Standard',
            fields: {
              name: text('Standard', 80),
              membersOnly: { type: 'boolean', label: 'Members only' },
              purity: text('Purity', 80),
              quantity: text('Quantity', 80),
              labeling: text('Labeling', 80),
              sometimes: text('Sometimes', 80),
            },
          },
        },
        standardsNotes: paragraphs('Notes under the table', 10, 'Note'),
      },
    },
  },
  {
    key: 'testing-page',
    title: 'Free testing page',
    description: 'Headline, eligibility notice and confirmation message around the sample registration form.',
    path: '/testing',
    spec: {
      type: 'group',
      label: 'Free testing',
      fields: {
        title: text('Headline', 120),
        noticeTitle: text('Notice heading', 160),
        noticeBody: longText('Notice', 600),
        completeTitle: text('Confirmation heading', 120),
        completeBody: longText('Confirmation message', 600),
      },
    },
  },
  { key: 'legal.privacy', title: 'Privacy policy', description: 'The /privacy page.', path: '/privacy', spec: legalSpec() },
  { key: 'legal.terms', title: 'Terms of use', description: 'The /terms page.', path: '/terms', spec: legalSpec() },
  { key: 'legal.refund', title: 'Refund policy', description: 'The /refund page.', path: '/refund', spec: legalSpec() },
  { key: 'legal.data-deletion', title: 'Data deletion', description: 'The /data-deletion page.', path: '/data-deletion', spec: legalSpec() },
];

export const contentBlock = (key: string): ContentBlock | undefined =>
  CONTENT_BLOCKS.find((block) => block.key === key);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanHref = (value: string, label: string): string => {
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const parsed = new URL(value);
    if (['https:', 'http:', 'mailto:'].includes(parsed.protocol)) return value;
  } catch {
    // fall through
  }
  throw new ValidationError(`${label} must be a site path like /terms or a full https:// link`);
};

export const validateContent = (spec: FieldSpec, value: unknown, path: string): unknown => {
  const label = path || spec.label;
  switch (spec.type) {
    case 'text':
    case 'href':
    case 'email': {
      if (value !== null && value !== undefined && typeof value !== 'string') throw new ValidationError(`${label} must be text`);
      const trimmed = typeof value === 'string' ? value.trim() : '';
      const optional = spec.type !== 'email' && spec.optional === true;
      if (!trimmed) {
        if (optional) return null;
        throw new ValidationError(`${label} is required`);
      }
      if (spec.type === 'text') {
        if (trimmed.length > spec.max) throw new ValidationError(`${label} must be ${spec.max} characters or fewer`);
        return trimmed;
      }
      if (trimmed.length > 500) throw new ValidationError(`${label} is too long`);
      if (spec.type === 'email') {
        if (!EMAIL_PATTERN.test(trimmed)) throw new ValidationError(`${label} must be an email address`);
        return trimmed;
      }
      return cleanHref(trimmed, label);
    }
    case 'boolean':
      return value === true;
    case 'choice': {
      const match = spec.options.find((option) => option.value === value);
      if (!match) throw new ValidationError(`${label} must be one of: ${spec.options.map((option) => option.label).join(', ')}`);
      return match.value;
    }
    case 'list': {
      const items = value === null || value === undefined ? [] : value;
      if (!Array.isArray(items)) throw new ValidationError(`${label} must be a list`);
      if (items.length > spec.max) throw new ValidationError(`${label} can have at most ${spec.max} items`);
      if (spec.min && items.length < spec.min) throw new ValidationError(`${label} needs at least ${spec.min} item${spec.min === 1 ? '' : 's'}`);
      return items.map((item, index) => validateContent(spec.item, item, `${label} › ${spec.itemLabel} ${index + 1}`));
    }
    case 'group': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError(`${label} is invalid`);
      const record = value as Record<string, unknown>;
      const cleaned: Record<string, unknown> = {};
      for (const [key, field] of Object.entries(spec.fields)) {
        cleaned[key] = validateContent(field, record[key], path ? `${path} › ${field.label}` : field.label);
      }
      return cleaned;
    }
  }
};

export const validateBlockContent = (block: ContentBlock, value: unknown): Record<string, unknown> => {
  const content = validateContent(block.spec, value, '') as Record<string, unknown>;
  const problem = block.check?.(content);
  if (problem) throw new ValidationError(problem);
  return content;
};
