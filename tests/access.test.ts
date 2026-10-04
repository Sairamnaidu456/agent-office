import { Readable } from 'node:stream';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Ctx } from '../src/server/office/context.js';
import type { RouteRequest } from '../src/server/http/router.js';
import { accessRoutes } from '../src/server/http/routes/access.js';

test('members cannot read invite secrets or mutate invites', async () => {
  const ctx = { meOf: () => ({ admin: false }), accounts: new Proxy({}, { get() { throw new Error('Accounts must not be touched'); } }) } as unknown as Ctx;
  for (const route of [accessRoutes.accounts, accessRoutes.invites]) {
    let status = 0;
    const res = { writeHead(code: number) { status = code; return this; }, end() {} };
    await route.handle(ctx, { res, session: {} } as unknown as RouteRequest & { session: {} });
    assert.equal(status, 403);
  }
});

test('capabilities reflect demotion on the next request', () => {
  let admin = true;
  const ctx = { meOf: () => ({ admin }) } as unknown as Ctx;
  let payload = '';
  const res = { writeHead() { return this; }, end(body: string) { payload = body; } };
  const request = { res, session: {} } as unknown as RouteRequest & { session: {} };
  accessRoutes.capabilities.handle(ctx, request);
  assert.equal(JSON.parse(payload).capabilities.manageAccounts, true);
  admin = false;
  accessRoutes.capabilities.handle(ctx, request);
  assert.equal(JSON.parse(payload).capabilities.manageAccounts, false);
});


test('invite mutation rechecks permissions after reading the body', async () => {
  let checks = 0;
  const ctx = { meOf: () => ({ admin: ++checks === 1 }), accounts: new Proxy({}, { get() { throw new Error('No mutation after demotion'); } }) } as unknown as Ctx;
  const req = Object.assign(Readable.from([Buffer.from('{"action":"create","role":"admin"}')]), { headers: { 'content-type': 'application/json' } });
  let status = 0;
  const res = { writeHead(code: number) { status = code; return this; }, end() {} };
  await accessRoutes.invites.handle(ctx, { req, res, session: {} } as unknown as RouteRequest & { session: {} });
  assert.equal(status, 403);
  assert.equal(checks, 2);
});
