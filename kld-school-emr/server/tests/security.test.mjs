import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256, timingSafeEqual } from '../utils/security.js';

test('sha256 is deterministic and timing-safe comparison works', () => {
  assert.equal(sha256('token'), sha256('token'));
  assert.equal(timingSafeEqual('abc', 'abc'), true);
  assert.equal(timingSafeEqual('abc', 'abd'), false);
});
