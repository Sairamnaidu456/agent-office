import type { QueueState, WorkerInfo } from '../../shared/protocol.js';

/** Deliberately omits prompts, terminal output, paths and account identifiers. */
export function floorSnapshot(id: string, name: string, queue: QueueState, workers: WorkerInfo[]) {
  return {
    id, name, queueLimit: queue.maxWorkers, paused: queue.maxWorkers === 0,
    counts: {
      queued: queue.tasks.filter(t => t.status === 'queued').length,
      running: queue.tasks.filter(t => t.status === 'running').length,
      finished: queue.tasks.filter(t => t.status === 'done').length,
      failed: queue.tasks.filter(t => t.status === 'done' && t.outcome === 'failed').length,
    },
    workers: workers.map(w => ({ id: w.id, name: w.name, status: w.status })),
    tasks: queue.tasks.map(t => ({ id: t.id, title: t.title, status: t.status, outcome: t.outcome, error: t.error, workerName: t.workerName })),
    warnings: queue.tasks.filter(t => t.status === 'running' && !workers.some(w => w.id === t.workerId))
      .map(t => `Running task “${t.title}” has no seated worker.`),
  };
}
