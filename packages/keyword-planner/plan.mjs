import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const stop = new Set(['a', 'an', 'the', 'for', 'to', 'of', 'and', 'how', 'best', 'buy', 'price', 'vs']);
const tokens = (s) => new Set(s.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter((t) => !stop.has(t)) ?? []);
export function plan(input, threshold = 0.5) {
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) throw new Error('Threshold must be > 0 and <= 1');
  const keywords = [...new Set(input.split(/\r?\n/).map((s) => s.trim().normalize('NFC').toLowerCase()).filter(Boolean))].sort();
  if (!keywords.length || keywords.length > 2000) throw new Error('Provide 1–2000 unique keywords, one per line');
  if (keywords.some((s) => s.length > 500 || /[\x00-\x1f\x7f]/.test(s))) throw new Error('Keywords must be <= 500 characters without control characters');
  const clusters = [];
  for (const keyword of keywords) {
    const words = tokens(keyword);
    let winner;
    let best = threshold;
    for (const cluster of clusters) {
      const shared = [...words].filter((t) => cluster.words.has(t)).length;
      const union = new Set([...words, ...cluster.words]).size;
      const score = union ? shared / union : 0;
      if (score >= best && (!winner || score > best)) { winner = cluster; best = score; }
    }
    if (winner) winner.keywords.push(keyword);
    else clusters.push({ anchor: keyword, words, keywords: [keyword] });
  }
  return clusters.map(({ anchor, keywords }, index) => ({ id: `topic-${index + 1}`, anchor, keywords }));
}

// Neutralize spreadsheet formulas while preserving CSV quoting and Unicode.
export function cell(value) {
  const text = String(value);
  return '"' + (/^[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"';
}
export function csv(clusters) {
  const rows = [['topic', 'draft_anchor', 'keyword', 'review_status']];
  for (const cluster of clusters) for (const keyword of cluster.keywords) rows.push([cluster.id, cluster.anchor, keyword, 'needs human review']);
  return rows.map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
export function briefs(clusters) {
  return '# Draft content planning worksheet\n\nLexical suggestions only. No demand, volume, intent, or ranking data inferred.\n\n' + clusters.map((c) => [
    `## ${c.id}`, `Draft anchor: ${JSON.stringify(c.anchor)}`, `Related queries: ${c.keywords.map((k) => JSON.stringify(k)).join('; ')}`,
    'Audience and problem: [editor to complete]', 'Intent after search-result review: [editor to complete]',
    'Existing URL / merge decision: [editor to complete]', 'Evidence and expert sources: [editor to complete]',
    'Draft outline: [editor to complete]', 'Owner / priority / due date: [editor to complete]',
    'Approval: [pending]', '',
  ].join('\n\n')).join('\n');
}
export function run(args) {
  if (args.length < 2 || args.length > 3) throw new Error('Usage: node plan.mjs keywords.txt NEW_OUTPUT_DIRECTORY [threshold]');
  const clusters = plan(readFileSync(args[0], 'utf8'), args[2] === undefined ? 0.5 : Number(args[2]));
  const directory = resolve(args[1]);
  // A fresh directory prevents accidental replacement of a customer's deliverable.
  mkdirSync(directory);
  writeFileSync(resolve(directory, 'clusters.csv'), csv(clusters));
  writeFileSync(resolve(directory, 'briefs.md'), briefs(clusters));
  writeFileSync(resolve(directory, 'summary.json'), JSON.stringify({ method: 'lexical-anchor-jaccard', threshold: args[2] === undefined ? 0.5 : Number(args[2]), keywordCount: clusters.reduce((n, c) => n + c.keywords.length, 0), clusterCount: clusters.length }, null, 2) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { run(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
