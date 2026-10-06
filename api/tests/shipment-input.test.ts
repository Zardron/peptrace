import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidationError } from '../src/admin-input.js';
import { resultValues, shipmentValues } from '../src/shipment-input.js';

const accountId = '6f1c2f44-2f8e-4a3b-9b0a-1f2e3d4c5b6a';

test('shipment updates only include fields that were sent', () => {
  assert.deepEqual(shipmentValues({ service: ' Express ', weight: '' }), { service: 'Express', weight: null });
});

test('shipment updates map tracking, timeline and billing lists to the customer page shape', () => {
  const values = shipmentValues({
    milestones: [{ name: 'Received by lab', date: '2 Oct', completed: true, extra: 'ignored' }],
    timelineEvents: [{ event: 'Arrived', meta: null }],
    billingItems: [{ label: 'Testing', value: '199.5' }],
  });
  assert.deepEqual(values.milestones, [{ name: 'Received by lab', date: '2 Oct', completed: true }]);
  assert.deepEqual(values.timeline_events, [{ event: 'Arrived', meta: '', timestamp: '' }]);
  assert.deepEqual(values.billing_items, [{ label: 'Testing', value: 199.5 }]);
});

test('shipment updates reject invalid statuses, links and oversized lists', () => {
  assert.throws(() => shipmentValues({ status: 'lost' }), ValidationError);
  assert.throws(() => shipmentValues({ invoiceUrl: 'javascript:alert(1)' }), ValidationError);
  assert.throws(() => shipmentValues({ milestones: Array.from({ length: 13 }, () => ({ name: 'Step' })) }), ValidationError);
  assert.throws(() => shipmentValues({ milestones: [{ date: 'no name' }] }), ValidationError);
});

test('new results require an outcome, purity and test date, and mirror outcome into result', () => {
  const values = resultValues({ outcome: 'pass', purity: 99.2, testedAt: '2026-10-01' }, accountId, false);
  assert.equal(values.outcome, 'pass');
  assert.equal(values.result, 'pass');
  assert.equal(values.purity, 99.2);
  assert.throws(() => resultValues({ outcome: 'pass', testedAt: '2026-10-01' }, accountId, false), ValidationError);
  assert.throws(() => resultValues({ outcome: 'maybe', purity: 90, testedAt: '2026-10-01' }, accountId, false), ValidationError);
  assert.throws(() => resultValues({ outcome: 'fail', purity: 101, testedAt: '2026-10-01' }, accountId, false), ValidationError);
});

test('result reports must be a public link or a private upload owned by the shipment account', () => {
  const own = `${accountId}/lab-report/report.pdf`;
  assert.equal(resultValues({ coaUrl: own }, accountId, true).coa_url, own);
  assert.equal(resultValues({ coaUrl: 'https://lab.example/coa' }, accountId, true).coa_url, 'https://lab.example/coa');
  assert.throws(() => resultValues({ coaUrl: 'someone-else/lab-report/report.pdf' }, accountId, true), ValidationError);
  assert.throws(() => resultValues({ coaUrl: `${accountId}/coa/customer-upload.pdf` }, accountId, true), ValidationError);
  assert.throws(() => resultValues({ coaUrl: `${accountId}/lab-report/../../other/file.pdf` }, accountId, true), ValidationError);
});
