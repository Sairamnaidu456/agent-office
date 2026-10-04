import test from 'node:test';
import assert from 'node:assert/strict';
import { floorSnapshot } from '../src/server/operations/snapshot.js';
import { operationsRoutes } from '../src/server/http/routes/operations.js';

test('operations reports actual outcomes and orphaned running tasks without prompts', () => {
  const snapshot = floorSnapshot('f', 'Floor', { maxWorkers: 0, tasks: [
    { id: 'a', title: 'Start', prompt: 'private prompt', addedBy: 'private account', addedAt: 1, status: 'running', workerId: 'missing' },
    { id: 'b', title: 'Failure', prompt: 'secret', addedBy: 'owner', addedAt: 1, status: 'done', outcome: 'failed', error: 'CLI missing' },
    { id: 'c', title: 'Stopped', prompt: '', addedBy: '', addedAt: 1, status: 'done', outcome: 'killed' },
  ] }, []);
  assert.equal(snapshot.paused, true);
  assert.deepEqual(snapshot.counts, { queued: 0, running: 1, finished: 2, failed: 1 });
  assert.equal(snapshot.tasks[1].error, 'CLI missing');
  assert.equal(snapshot.tasks[2].outcome, 'killed');
  assert.equal(snapshot.warnings.length, 1);
  assert.equal(JSON.stringify(snapshot).includes('private prompt'), false);
  assert.equal(JSON.stringify(snapshot).includes('private account'), false);
});
test('operations page and data require an authenticated session', () => {
  assert.equal(operationsRoutes.data.auth, 'session');
  assert.equal(operationsRoutes.page.auth, 'session');
});
