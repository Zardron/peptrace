import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { parseVendorSignupApplication } from '../src/vendor-signup.js';

const validApplication = {
  distributesPeptides: true,
  currentSituation: 'selling-unlisted',
  vendorName: 'Northstar Research',
  batchIdentifiers: 'some',
  premiumOptIn: false,
  termsAccepted: true,
};

test('vendor applications accept valid form data and normalize the vendor name', () => {
  const result = parseVendorSignupApplication({ ...validApplication, vendorName: '  Northstar Research  ' });
  assert.deepEqual(result, {
    data: {
      distributesPeptides: true,
      currentSituation: 'selling-unlisted',
      vendorName: 'Northstar Research',
      batchIdentifiers: 'some',
      premiumOptIn: false,
    },
  });
});

test('vendor applications reject missing required data and unaccepted terms', () => {
  assert.deepEqual(parseVendorSignupApplication({ ...validApplication, termsAccepted: false }), {
    error: 'Accept the Partner Service Terms to apply',
  });
  assert.deepEqual(parseVendorSignupApplication({ ...validApplication, currentSituation: 'unknown' }), {
    error: 'Select your current situation',
  });
  assert.deepEqual(parseVendorSignupApplication(null), { error: 'Application details are required' });
});

test('vendor signup migration keeps manager links one-to-many and approval atomic', () => {
  const sql = fs.readFileSync(new URL('../migrations/025_vendor_signup_applications.sql', import.meta.url), 'utf8');
  assert.match(sql, /create table if not exists public\.vendor_signup_application\s*\(/i);
  assert.match(sql, /status text not null default 'pending'/i);
  assert.match(sql, /manager_user_id uuid\s+references public\.user_accounts/i);
  assert.match(sql, /create or replace function public\.approve_vendor_signup_application/i);
  assert.match(sql, /for update/i);
  assert.match(sql, /revoke all on function public\.approve_vendor_signup_application/i);
});