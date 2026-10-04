import type { RunResult } from './index.js';
import { compareResults } from './index.js';

const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));
const labels = { passed: 'Checks passed', assertion_failed: 'Failure reproduced', unverified: 'Could not verify' };

/** Portable, script-free evidence. Statuses cover this plan, never the entire application. */
export function renderReport(before: RunResult, after: RunResult): string {
  const verified = compareResults(before, after).verified;
  const cards = [before, after].map((result, i) => `
    <section class="card">
      <div class="card-head"><h2>${i ? 'After repair' : 'Before repair'}</h2><span class="status ${result.status}">${escape(labels[result.status])}</span></div>
      ${result.error ? `<p class="error">${escape(result.error)}</p>` : '<p class="note">Every recorded step completed.</p>'}
      ${result.screenshots.filter(s => /^(before|after)\.png$/.test(s)).map(s => `<img alt="${i ? 'After' : 'Before'} browser evidence" src="${s}">`).join('')}
      <details><summary>Inspect run evidence</summary><pre>${escape(JSON.stringify(result, null, 2))}</pre></details>
    </section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ProofFix · regression evidence</title>
    <style>
      *{box-sizing:border-box}body{margin:0;background:#f4f6fa;color:#192336;font:16px/1.55 system-ui,sans-serif}
      main{max-width:1160px;margin:48px auto;padding:0 24px}.brand{font-weight:750;letter-spacing:.04em;color:#415572;margin-bottom:24px}
      .verdict{background:#fff;border:1px solid #dce3ed;border-top:5px solid ${verified ? '#188454' : '#b27818'};border-radius:12px;padding:28px;margin-bottom:24px}
      h1{font-size:30px;line-height:1.2;margin:0 0 12px}h2{font-size:20px;margin:0}.verdict p{margin:8px 0;color:#506079}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.card{background:#fff;border:1px solid #dce3ed;border-radius:12px;padding:20px;min-width:0}
      .card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.status{font-size:12px;font-weight:700;border-radius:20px;padding:5px 10px;background:#fff0d4;color:#825714}
      .status.passed{background:#e0f5e9;color:#146b44}.status.assertion_failed{background:#fce6e5;color:#9d3530}.error,.note{font-size:14px;color:#506079}
      img{display:block;max-width:100%;max-height:560px;margin:20px auto;border:1px solid #dce3ed;border-radius:6px;object-fit:contain}
      details{border-top:1px solid #e3e8f0;padding-top:14px;margin-top:20px}summary{cursor:pointer;font-size:14px;color:#415572}
      pre{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f6fa;border-radius:6px;padding:12px}footer{font-size:13px;color:#65748c;margin:24px 0}
      @media(max-width:760px){main{margin:24px auto;padding:0 16px}.grid{grid-template-columns:1fr}h1{font-size:24px}}
    </style></head><body><main><div class="brand">PROOFFIX / LOCAL REGRESSION EVIDENCE</div>
    <header class="verdict"><h1>${verified ? 'The same regression failed before and passed after.' : 'This repair has not been verified.'}</h1>
      <p>${verified ? 'Matching test and execution fingerprints. An assertion failed on the before version; all recorded checks passed on the after version.' : 'Verification requires a reproduced assertion failure before, a full pass after, and matching test and execution fingerprints.'}</p>
      <p>This result covers the recorded checks. It does not certify the entire application.</p></header>
    <div class="grid">${cards}</div><footer>Local, unsigned artifacts. Retain the frozen plan and both source versions with this report. No AI inference is performed by this runner.</footer>
    </main></body></html>`;
}
