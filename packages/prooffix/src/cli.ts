import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validatePlan, runPlan, renderReport, compareResults } from './index.js';

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'prompt') {
    console.log('Create a JSON plan for ProofFix version 1. Return JSON only: {"version":1,"name":"Bug description","steps":[...]}. Maximum 20 steps. Actions: click/fill with target {testId:"id"} or {role:"button",name:"exact accessible name"}; fill has value. Assertions: assertVisible with target, assertText with target and exact value, assertUrl with literal loopback URL value (compares path/query/hash across before/after ports), assertNoHorizontalOverflow, assertBodyScrollable. reload has no fields. At least one assertion. No scripts, shell, arbitrary selectors, or external URLs. Describe the bug and test IDs to your configured AI agent; review its plan before running. This command does not invoke an AI model.');
    return;
  }
  if (command !== 'verify' || args.length !== 4) throw new Error('Usage: tsx packages/prooffix/src/cli.ts verify PLAN.json BEFORE_URL AFTER_URL OUTPUT_DIR | prompt');
  const [file,beforeUrl,afterUrl,outputDir] = args;
  const plan = validatePlan(JSON.parse(await readFile(file!, 'utf8')));
  const output = resolve(outputDir!);
  await mkdir(output,{recursive:true});
  await writeFile(resolve(output,'plan.json'),JSON.stringify(plan,null,2));
  const options = {outputDir:output, executablePath:process.env.CHROME_PATH};
  const before = await runPlan(plan,beforeUrl!,{...options,label:'before'});
  const after = await runPlan(plan,afterUrl!,{...options,label:'after'});
  const comparison = compareResults(before,after);
  await writeFile(resolve(output,'result.json'),JSON.stringify(comparison,null,2));
  await writeFile(resolve(output,'report.html'),renderReport(before,after));
  console.log(`${comparison.verified ? 'Verified' : 'Unverified'}: ${resolve(output,'report.html')}`);
  process.exitCode = comparison.verified ? 0 : 2;
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
