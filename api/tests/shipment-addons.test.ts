import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidAddonLab, parseShipmentAddons, shipmentAddonAmountCents } from '../src/shipment-addons.js';

test('all restored add-ons have server-owned prices', () => {
  const addons = parseShipmentAddons(['different-lab', 'endotoxin', 'heavy-metals', 'solvents']);
  assert.deepEqual(addons?.map(({ id, title, price, amountCents }) => ({ id, title, price, amountCents })), [
    { id: 'different-lab', title: 'Choose a different lab', price: 49.99, amountCents: 4999 },
    { id: 'endotoxin', title: 'Endotoxin', price: 49, amountCents: 4900 },
    { id: 'heavy-metals', title: 'Heavy metals (Pb, Cd, As, Hg)', price: 120, amountCents: 12000 },
    { id: 'solvents', title: 'Solvents', price: 120, amountCents: 12000 },
  ]);
  assert.equal(shipmentAddonAmountCents(addons ?? []), 33899);
  assert.equal(isValidAddonLab(addons ?? [], 'ABC Labs'), true);
  assert.equal(isValidAddonLab(addons ?? [], 'Unlisted Lab'), false);
});

test('shipment add-on parser rejects unknown, duplicate and malformed selections', () => {
  assert.deepEqual(parseShipmentAddons(undefined), []);
  assert.deepEqual(parseShipmentAddons([]), []);
  assert.equal(parseShipmentAddons(['unknown']), null);
  assert.equal(parseShipmentAddons(['endotoxin', 'endotoxin']), null);
  assert.equal(parseShipmentAddons('endotoxin'), null);
  assert.equal(parseShipmentAddons([42]), null);
});
