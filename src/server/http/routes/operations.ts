import type { Route } from '../router.js';
import { send } from '../util.js';
import { floorSnapshot } from '../../operations/snapshot.js';
import { operationsPage } from '../../operations/page.js';

export const operationsRoutes = {
  data: { method: 'GET', path: '/api/operations', auth: 'session', handle: (ctx, { res }) =>
    send(res, 200, { observedAt: Date.now(), floors: [...ctx.floors.values()].map(f =>
      floorSnapshot(f.def.id, f.def.name, f.queue.state(), f.workers.list())) }) },
  page: { method: 'GET', path: '/operations', auth: 'session', handle: (_ctx, { res }) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(operationsPage);
  } },
} satisfies Record<string, Route>;
