// Worker handler test (v2.0). Drives the Worker's fetch() with a fake KV and
// real Request/Response (Node 18+ globals). Covers submit -> replay -> board,
// dedup, rank, and validation rejections.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { dayKey } from '../src/daily.js';

function fakeKV() {
  const store = new Map();
  return {
    async get(key, type) {
      const v = store.get(key);
      if (v === undefined) return null;
      return type === 'json' ? JSON.parse(v) : v;
    },
    async put(key, value) {
      store.set(key, value);
    },
    _store: store,
  };
}

const TODAY = dayKey(new Date()); // the Worker only accepts today's Detroit day

function submit(env, body) {
  return worker.fetch(
    new Request('https://w/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    env,
  );
}

test('submit: replays inputs, stores an entry, returns rank', async () => {
  const env = { BOARD: fakeKV() };
  const res = await submit(env, {
    dayKey: TODAY,
    jumpSteps: [], // no-jump run -> dies at the first obstacle
    name: 'Ryan',
    clientId: 'client-abc123',
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.score > 0); // authoritative, server-computed
  assert.equal(body.rank, 1);
  assert.equal(body.entries.length, 1);
  assert.equal(body.entries[0].name, 'Ryan');
  assert.equal(body.entries[0].clientId, undefined); // clientId not leaked
});

test('board: GET returns the stored top entries', async () => {
  const env = { BOARD: fakeKV() };
  await submit(env, { dayKey: TODAY, jumpSteps: [], name: 'A', clientId: 'client-aaaaaa' });
  const res = await worker.fetch(new Request(`https://w/board/${TODAY}`), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.day, TODAY);
  assert.equal(body.entries.length, 1);
});

test('submit: same client, no improvement -> not re-added, rank stable', async () => {
  const env = { BOARD: fakeKV() };
  await submit(env, { dayKey: TODAY, jumpSteps: [], name: 'A', clientId: 'client-aaaaaa' });
  const res = await submit(env, {
    dayKey: TODAY,
    jumpSteps: [],
    name: 'A',
    clientId: 'client-aaaaaa',
  });
  const body = await res.json();
  assert.equal(body.entries.length, 1); // still one entry for this client
  assert.equal(body.rank, 1);
});

test('submit: rejects a non-today day (409)', async () => {
  const env = { BOARD: fakeKV() };
  const res = await submit(env, {
    dayKey: '20200101',
    jumpSteps: [],
    name: 'A',
    clientId: 'client-aaaaaa',
  });
  assert.equal(res.status, 409);
});

test('submit: rejects bad inputs (400)', async () => {
  const env = { BOARD: fakeKV() };
  const res = await submit(env, {
    dayKey: TODAY,
    jumpSteps: [5, 3], // not ascending
    name: 'A',
    clientId: 'client-aaaaaa',
  });
  assert.equal(res.status, 400);
});

test('submit: rejects a missing/short clientId (400)', async () => {
  const env = { BOARD: fakeKV() };
  const res = await submit(env, { dayKey: TODAY, jumpSteps: [], name: 'A', clientId: 'x' });
  assert.equal(res.status, 400);
});

test('OPTIONS preflight returns 204 with CORS headers', async () => {
  const env = { BOARD: fakeKV() };
  const res = await worker.fetch(
    new Request('https://w/submit', { method: 'OPTIONS', headers: { Origin: 'https://x' } }),
    env,
  );
  assert.equal(res.status, 204);
  assert.ok(res.headers.get('Access-Control-Allow-Methods').includes('POST'));
});
