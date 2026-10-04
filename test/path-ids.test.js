'use strict';

/**
 * Path-injection tests for identifiers interpolated into request paths.
 *
 * Each identifier must be rejected with a TypeError before any request is
 * sent; otherwise an id like "../../v2/internal/admin" redirects the request,
 * with the caller's API key, to another path on the API host. Offline: fetch
 * is stubbed, so no API key or network access is needed.
 *
 *   node --test test/path-ids.test.js
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { PublicSafetyAPI, PublicSafetyAPIError } = require('..');

const BAD_IDS = [
  '../../v2/internal/admin',
  '..',
  '.',
  'a/b',
  'fire-hifld-13184?admin=1',
  'fire-hifld-13184#frag',
  '%2e%2e',
  'fire-hifld-13184\n',
  'fire-hifld-13184 ',
  '',
  'a'.repeat(65),
  '\u0661\u0662\u0663', // non-ASCII digits
  undefined,
  null,
  true,
  {},
  ['fire-hifld-13184'],
];

const CALLS = [
  ['stations.get', (c, id) => c.stations.get(id), 'fire-hifld-13184', '/v1/stations/fire-hifld-13184'],
  ['states.summary', (c, id) => c.states.summary(id), 'ca', '/v1/states/CA/summary'],
];

// Stub fetch for the duration of fn; returns the URLs it was asked to fetch.
async function recordFetches(fn) {
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    sent.push(new URL(url));
    return new Response(JSON.stringify({ detail: { message: 'not found', code: 'NOT_FOUND' } }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    await fn();
  } finally {
    globalThis.fetch = realFetch;
  }
  return sent;
}

for (const [name, call, good, path] of CALLS) {
  for (const bad of BAD_IDS) {
    test(`${name} rejects ${JSON.stringify(bad) ?? String(bad)} before sending`, async () => {
      const sent = await recordFetches(() =>
        assert.rejects(call(new PublicSafetyAPI({ apiKey: 'test' }), bad), (err) => {
          assert.ok(err instanceof TypeError, `expected TypeError, got ${err && err.name}`);
          assert.match(err.message, /must contain only letters, digits/);
          return true;
        }),
      );
      assert.deepEqual(sent, []);
    });
  }

  test(`${name} sends a real id to ${path}`, async () => {
    const sent = await recordFetches(() =>
      assert.rejects(
        call(new PublicSafetyAPI({ apiKey: 'test' }), good),
        (err) => err instanceof PublicSafetyAPIError && err.status === 404,
      ),
    );
    assert.deepEqual(
      sent.map((u) => [u.host, u.pathname, u.search]),
      [['api.publicsafetyapi.dev', path, '']],
    );
  });
}
