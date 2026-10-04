import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { compareResults, renderReport, runPlan, validatePlan } from './index.js';

// Deliberately seeded examples demonstrate runner behavior, not autonomous AI discovery.
const cases = [
  { name: 'form', steps: [
    { action: 'fill', target: { testId: 'name' }, value: 'Ada' },
    { action: 'click', target: { testId: 'save' } },
    { action: 'reload' },
    { action: 'assertText', target: { testId: 'saved-name' }, value: 'Ada' },
  ] },
  { name: 'modal', steps: [
    { action: 'click', target: { testId: 'open' } },
    { action: 'click', target: { testId: 'close' } },
    { action: 'assertBodyScrollable' },
  ] },
  { name: 'overflow', steps: [{ action: 'assertNoHorizontalOverflow' }] },
];

async function main() {
  if (process.argv.length > 3) throw new Error('Usage: npm run demo -- [OUTPUT_DIR]');
  const output = process.argv[2] ? resolve(process.argv[2]) : await mkdtemp(join(tmpdir(), 'prooffix-demo-'));
  await mkdir(output, { recursive: true });
  const fixtures = new Map<string, Buffer>(await Promise.all(cases.map(async entry => [
    `/${entry.name}`, await readFile(new URL(`../fixtures/${entry.name}.html`, import.meta.url)),
  ] as const)));
  const server = createServer((req, res) => {
    const fixture = fixtures.get(new URL(req.url ?? '/', 'http://127.0.0.1').pathname);
    res.writeHead(fixture ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fixture ?? 'Not found');
  });
  await new Promise<void>((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Demo server did not start');
  const base = `http://127.0.0.1:${address.port}`;
  const results = [];
  try {
    for (const entry of cases) {
      const plan = validatePlan({ version: 1, name: entry.name, steps: entry.steps });
      const dir = join(output, entry.name);
      const options = { outputDir: dir, executablePath: process.env.CHROME_PATH };
      const before = await runPlan(plan, `${base}/${entry.name}`, { ...options, label: 'before' });
      const after = await runPlan(plan, `${base}/${entry.name}?fixed=1`, { ...options, label: 'after' });
      const result = compareResults(before, after);
      results.push({ name: entry.name, ...result });
      await writeFile(join(dir, 'plan.json'), JSON.stringify(plan, null, 2));
      await writeFile(join(dir, 'result.json'), JSON.stringify(result, null, 2));
      await writeFile(join(dir, 'report.html'), renderReport(before, after));
      console.log(`${entry.name}: ${result.verified ? 'seeded repair verified' : 'unverified'} — ${join(dir, 'report.html')}`);
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>(done => server.close(() => done()));
  }
  await writeFile(join(output, 'summary.json'), JSON.stringify({
    description: 'Three deliberately seeded bugs and fixed controls. No model inference, customer testing, or competitor superiority demonstrated.',
    results,
  }, null, 2));
  console.log(`Evidence saved to ${output}`);
  if (results.some(result => !result.verified)) process.exitCode = 2;
}
main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
