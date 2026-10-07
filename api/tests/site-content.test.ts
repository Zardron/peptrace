import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultSiteContent as frontendDefaults } from '../../frontend/src/content/defaults.js';
import { ValidationError } from '../src/admin-input.js';
import { defaultSiteContent } from '../src/site-content-defaults.js';
import { CONTENT_BLOCKS, contentBlock, validateBlockContent } from '../src/site-content-schema.js';

const defaults = defaultSiteContent as unknown as Record<string, Record<string, unknown>>;
const clone = <T>(value: T): T => structuredClone(value);

test('API and frontend default site content are identical', () => {
  assert.deepEqual(defaultSiteContent, frontendDefaults);
});

test('every content block has defaults and no defaults lack a block', () => {
  assert.deepEqual(CONTENT_BLOCKS.map((block) => block.key).sort(), Object.keys(defaults).sort());
});

test('every default passes validation unchanged', () => {
  for (const block of CONTENT_BLOCKS) {
    assert.deepEqual(validateBlockContent(block, clone(defaults[block.key])), defaults[block.key], block.key);
  }
});

test('validation trims text, drops unknown fields and nulls empty optional fields', () => {
  const block = contentBlock('announcement')!;
  assert.deepEqual(
    validateBlockContent(block, { enabled: true, text: '  Lab closed Friday ', href: '', tone: 'warning', script: 'x' }),
    { enabled: true, text: 'Lab closed Friday', href: null, tone: 'warning' },
  );
});

test('validation rejects unsafe links, bad emails, unknown choices and oversize lists', () => {
  const announcement = contentBlock('announcement')!;
  for (const href of ['javascript:alert(1)', '//evil.example', 'data:text/html,hi']) {
    assert.throws(
      () => validateBlockContent(announcement, { enabled: true, text: 'Hi', href, tone: 'info' }),
      ValidationError,
      href,
    );
  }
  assert.throws(() => validateBlockContent(announcement, { enabled: true, text: 'Hi', tone: 'loud' }), ValidationError);
  assert.throws(() => validateBlockContent(announcement, { enabled: true, text: ' ', tone: 'info' }), /Add a message/);

  const membership = contentBlock('membership')!;
  assert.throws(
    () => validateBlockContent(membership, { ...clone(defaults.membership), supportEmail: 'not-an-email' }),
    ValidationError,
  );
  assert.throws(() => validateBlockContent(membership, { ...clone(defaults.membership), plans: [] }), /at least 1 item/);

  const footer = contentBlock('footer')!;
  const columns = Array.from({ length: 6 }, () => ({ title: 'Col', links: [] }));
  assert.throws(() => validateBlockContent(footer, { ...clone(defaults.footer), columns }), /at most 5/);
});

test('validation errors name the field that failed', () => {
  const terms = clone(defaults['legal.terms']) as { sections: Array<{ heading: string }> };
  terms.sections[1].heading = '';
  assert.throws(() => validateBlockContent(contentBlock('legal.terms')!, terms), /Sections › Section 2 › Heading is required/);
});
