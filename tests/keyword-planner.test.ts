import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('keyword planner delivers deterministic groups and spreadsheet-safe CSV without replacing output', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'keyword-kit-'));
  const cli = path.resolve('packages/keyword-planner/plan.mjs');
  try {
    const input = path.join(root, 'input.txt');
    writeFileSync(input, 'coffee grinder\nBest coffee grinder\nCOFFEE GRINDER\nespresso machine\n=HYPERLINK("bad")\n');
    execFileSync(process.execPath, [cli, input, path.join(root, 'out')]);
    const result = readFileSync(path.join(root, 'out/clusters.csv'), 'utf8');
    assert.ok(result.includes(`"'=hyperlink(""bad"")"`));
    const summary = JSON.parse(readFileSync(path.join(root, 'out/summary.json'), 'utf8'));
    assert.equal(summary.keywordCount, 4);
    assert.equal(summary.clusterCount, 3);
    writeFileSync(input, 'espresso machine\ncoffee grinder\n=HYPERLINK("bad")\nBest coffee grinder');
    execFileSync(process.execPath, [cli, input, path.join(root, 'second')]);
    assert.equal(result, readFileSync(path.join(root, 'second/clusters.csv'), 'utf8'));
    assert.throws(() => execFileSync(process.execPath, [cli, input, path.join(root, 'out')], { stdio: 'pipe' }));
    assert.equal(result, readFileSync(path.join(root, 'out/clusters.csv'), 'utf8'));
    assert.throws(() => execFileSync(process.execPath, [cli, input, path.join(root, 'invalid'), '0'], { stdio: 'pipe' }));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
