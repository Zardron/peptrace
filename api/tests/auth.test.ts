import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hashPassword,
  isValidEmail,
  verifyPassword,
} from '../src/auth.js';

test('password hashes verify without exposing or accepting the source password', () => {
  const password = 'Correct Horse Battery Staple!';
  const hash = hashPassword(password);
  assert.notEqual(hash, password);
  assert.equal(verifyPassword(password, hash), true);
  assert.equal(verifyPassword('wrong-password', hash), false);
});

test('malformed password records fail closed', () => {
  for (const value of ['', 'plain-text', 'scrypt$1$1$1$bad$bad', 'scrypt$16384$8$1$%%%$%%%']) {
    assert.equal(verifyPassword('anything', value), false);
  }
});

test('email validation accepts normal addresses and rejects ambiguous input', () => {
  assert.equal(isValidEmail('person@example.com'), true);
  assert.equal(isValidEmail('person+tag@example.co.uk'), true);
  assert.equal(isValidEmail(' person@example.com'), false);
  assert.equal(isValidEmail('person@example'), false);
});
