import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdtempSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { validatePlan, validateLocalUrl, hashPlan, compareResults, runPlan, renderReport } from '../packages/prooffix/src/index.js';

const plan = { version: 1, name: 'Profile persists', steps: [
  { action: 'fill', target: { testId: 'name' }, value: 'Ada' },
  { action: 'click', target: { testId: 'save' } },
  { action: 'reload' },
  { action: 'assertText', target: { testId: 'saved-name' }, value: 'Ada' },
] };

test('ProofFix accepts bounded plans and rejects arbitrary executable actions', () => {
  assert.doesNotThrow(() => validatePlan(plan));
  for (const input of [null, {}, { ...plan, version: 2 }, { ...plan, steps: [] },
    { ...plan, steps: [{ action: 'evaluate', value: 'fetch("https://example.com")' }] }]) {
    assert.throws(() => validatePlan(input));
  }
  assert.equal(hashPlan(validatePlan(plan)), hashPlan(validatePlan(JSON.parse(JSON.stringify(plan)))));
});

test('ProofFix rejects remote URLs, credentials, and non-HTTP targets', () => {
  for (const url of ['https://example.com', 'http://127.0.0.1.evil.test', 'file:///tmp/app.html',
    'http://user:password@localhost:3000', 'http://0.0.0.0:3000', 'http://localhost:3000']) {
    assert.throws(() => validateLocalUrl(url), url);
  }
  for (const url of ['http://127.0.0.1:3000', 'http://[::1]:3000']) {
    assert.doesNotThrow(() => validateLocalUrl(url));
  }
});

test('ProofFix report escapes error content and rejects injected image URLs', () => {
  const result = { planHash: 'example', status: 'unverified' as const,
    error: '<script>alert("bad")</script>', screenshots: ['" onerror="alert(1)', 'before.png'] };
  const html = renderReport(result, result);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('src="" onerror'));
});

test('ProofFix verifies only reproduced failure followed by same-plan same-config pass', () => {
  const before = { planHash: 'frozen', executionHash: 'same-config', status: 'assertion_failed' as const, screenshots: [] };
  const after = { ...before, status: 'passed' as const };
  assert.equal(compareResults(before, after).verified, true);
  assert.equal(compareResults(before, before).verified, false);
  assert.equal(compareResults(after, after).verified, false);
  assert.equal(compareResults(before, { ...after, planHash: 'new-plan' }).verified, false);
  assert.equal(compareResults(before, { ...after, executionHash: 'new-config' }).verified, false);
  assert.equal(compareResults({ ...before, status: 'unverified' }, after).verified, false);
  assert.equal(compareResults({ ...before, executionHash: undefined }, { ...after, executionHash: undefined }).verified, false);
});

test('ProofFix browser evidence reproduces seeded defects and distinguishes controls', {
  skip: process.env.PROOFFIX_BROWSER_TESTS !== '1',
  timeout: 120_000,
}, async (t) => {
  const fixtures = new Map(['modal', 'form', 'overflow'].map(name => [
    `/${name}`, readFileSync(new URL(`../packages/prooffix/fixtures/${name}.html`, import.meta.url)),
  ]));
  const server = createServer((request, response) => {
    const contents = fixtures.get(new URL(request.url!, 'http://localhost').pathname);
    response.writeHead(contents ? 200 : 404, { 'Content-Type': 'text/html' });
    response.end(contents || 'Not found');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const artifactRoot = mkdtempSync(path.join(tmpdir(), 'prooffix-evidence-'));
  const cases = [
    { name: 'form', plan },
    { name: 'modal', plan: { version: 1, name: 'Modal restores scroll', steps: [
      { action: 'click', target: { testId: 'open' } },
      { action: 'click', target: { testId: 'close' } },
      { action: 'assertBodyScrollable' },
    ] } },
    { name: 'overflow', plan: { version: 1, name: 'Mobile fits', steps: [
      { action: 'assertNoHorizontalOverflow' },
    ] } },
  ];
  const measurements: unknown[] = [];
  for (let repetition = 0; repetition < 3; repetition++) for (const entry of cases) {
    const started = Date.now();
    const validated = validatePlan(entry.plan);
    const options = { executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      outputDir: path.join(artifactRoot, `${entry.name}-${repetition}`), timeoutMs: 10000, viewport: { width: 375, height: 812 } };
    const before = await runPlan(validated, `${base}/${entry.name}`, { ...options, label: 'before' });
    const after = await runPlan(validated, `${base}/${entry.name}?fixed=1`, { ...options, label: 'after' });
    assert.equal(before.status, 'assertion_failed', `${entry.name} broken state: ${before.error}`);
    assert.equal(after.status, 'passed', `${entry.name} repaired state: ${after.error}`);
    assert.equal(before.planHash, after.planHash, 'repair must use unchanged plan');
    for (const screenshot of [...before.screenshots, ...after.screenshots]) assert.ok(existsSync(path.join(options.outputDir, screenshot)));
    assert.ok(before.screenshots.length && after.screenshots.length);
    assert.equal(compareResults(before, after).verified, true);
    assert.equal(compareResults(before, before).verified, false, 'both broken cannot verify repair');
    assert.equal(compareResults(after, after).verified, false, 'both good cannot verify repair');
    assert.equal(compareResults(before, { ...after, planHash: 'changed' }).verified, false, 'changed test cannot verify repair');
    assert.equal(compareResults({ ...before, status: 'unverified' }, after).verified, false, 'infrastructure failure cannot verify repair');
    if (repetition === 0 && entry.name === 'overflow') {
      const changedViewport = await runPlan(validated, `${base}/${entry.name}?fixed=1`, { ...options, label: 'after', viewport: { width: 1200, height: 812 } });
      assert.equal(changedViewport.status, 'passed');
      assert.equal(compareResults(before, changedViewport).verified, false, 'different viewport cannot prove repair');
      // Restore the evidence screenshot to the original unchanged viewport.
      await runPlan(validated, `${base}/${entry.name}?fixed=1`, { ...options, label: 'after' });
    }
    measurements.push({ fixture: entry.name, repetition, before: before.status, after: after.status, verified: compareResults(before, after).verified, milliseconds: Date.now() - started });
    writeFileSync(path.join(options.outputDir, 'report.html'), renderReport(before, after));
    t.diagnostic(`${entry.name} retained evidence: ${options.outputDir}`);
  }
  writeFileSync(path.join(artifactRoot, 'benchmark.json'), JSON.stringify({ description: 'Seeded deterministic fixtures; no model inference or competitor comparison', measurements }, null, 2));
  const baselineStarted = Date.now();
  const baselineBrowser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try {
    for (const fixed of [false, true]) {
      const page = await baselineBrowser.newPage();
      await page.goto(`${base}/form?fixed=${fixed ? '1' : '0'}`);
      await page.getByTestId('name').fill('Ada');
      await page.getByTestId('save').click();
      await page.reload();
      assert.equal(await page.getByTestId('saved-name').textContent(), fixed ? 'Ada' : '');
      await page.close();
    }
    const page = await baselineBrowser.newPage();
    await page.goto(`file://${artifactRoot}/form-0/report.html`);
    await page.screenshot({ path: path.join(artifactRoot, 'report.png'), fullPage: true });
  } finally { await baselineBrowser.close(); }
  writeFileSync(path.join(artifactRoot, 'baseline.json'), JSON.stringify({case:'form persistence',runs:2,milliseconds:Date.now()-baselineStarted,description:'Plain Playwright verifies same seeded behavior; not an AI competitor benchmark'},null,2));
  t.diagnostic(`Benchmark, plain Playwright baseline and report screenshot: ${artifactRoot}`);
  t.diagnostic('Starting unavailable target control');
  const unavailable = await runPlan(validatePlan(plan), 'http://127.0.0.1:1', {
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    outputDir: path.join(artifactRoot, 'unavailable'), timeoutMs: 5000,
  });
  t.diagnostic(`Unavailable control result: ${unavailable.error}`);
  assert.equal(unavailable.status, 'unverified', 'connection failure is not a reproduced bug');
  assert.match(unavailable.error || '', /ERR_UNSAFE_PORT|ERR_CONNECTION|Navigation|goto/i);
  const missing = await runPlan(validatePlan({ version: 1, name: 'Bad selector', steps: [
    { action: 'assertText', target: { testId: 'not-present' }, value: 'Ada' },
  ] }), `${base}/form`, {
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    outputDir: path.join(artifactRoot, 'missing-selector'), timeoutMs: 5000,
  });
  assert.equal(missing.status, 'unverified', 'selector-generation failure must not count as reproduced defect');
});
