import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidationError } from '../src/admin-input.js';
import { applicationValues, reviewValues } from '../src/vendor-application-input.js';

const valid = {
  email: ' Sales@Vendor.Example ',
  vendorName: ' Vendor Labs ',
  websiteUrl: 'vendor.example',
  distributesCommercially: true,
  situation: 'selling-unlisted',
  batchIdentifiers: 'all',
  premiumInterest: true,
  termsAccepted: true,
};

test('vendor applications normalize email, name and bare website domains', () => {
  assert.deepEqual(applicationValues(valid), {
    email: 'sales@vendor.example',
    vendor_name: 'Vendor Labs',
    website_url: 'https://vendor.example',
    distributes_commercially: true,
    situation: 'selling-unlisted',
    batch_identifiers: 'all',
    premium_interest: true,
  });
  assert.equal(applicationValues({ ...valid, batchIdentifiers: '', websiteUrl: '' }).batch_identifiers, null);
});

test('vendor applications require consent, a known situation and a safe website', () => {
  assert.throws(() => applicationValues({ ...valid, termsAccepted: false }), /authorized to represent/);
  assert.throws(() => applicationValues({ ...valid, distributesCommercially: 'yes' }), ValidationError);
  assert.throws(() => applicationValues({ ...valid, situation: 'other' }), /current situation/);
  assert.throws(() => applicationValues({ ...valid, email: 'nope' }), /valid email/);
  assert.throws(() => applicationValues({ ...valid, websiteUrl: 'javascript:alert(1)' }), ValidationError);
  assert.throws(() => applicationValues({ ...valid, websiteUrl: 'mailto:a@b.co' }), /http\(s\)/);
});

test('reviews only accept known statuses and clear empty notes', () => {
  assert.deepEqual(reviewValues({ status: 'contacted', adminNote: '  ' }), { status: 'contacted', admin_note: null });
  assert.throws(() => reviewValues({ status: 'archived' }), ValidationError);
  assert.throws(() => reviewValues({}), /Nothing to update/);
});
