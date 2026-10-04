import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Locator, type Page } from 'playwright-core';

export type Target = { testId?: string; role?: string; name?: string };
export type Step = { action: 'click' | 'fill' | 'reload' | 'assertNoHorizontalOverflow' | 'assertBodyScrollable' | 'assertVisible' | 'assertText' | 'assertUrl'; target?: Target; value?: string };
export type Plan = { version: 1; name: string; steps: Step[] };
export type RunResult = { planHash: string; executionHash?: string; browserVersion?: string; targetUrl?: string; startedAt?: string; status: 'passed' | 'assertion_failed' | 'unverified'; failureStep?: number; error?: string; screenshots: string[] };
const actions = ['click', 'fill', 'reload', 'assertNoHorizontalOverflow', 'assertBodyScrollable', 'assertVisible', 'assertText', 'assertUrl'];
const roles = ['button', 'textbox', 'link', 'dialog', 'heading', 'checkbox', 'combobox', 'alert', 'status'];
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function keys(value: Record<string, unknown>, allowed: string[]) { if (Object.keys(value).some(k => !allowed.includes(k))) throw new Error('Unknown plan property'); }
function string(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 2000; }
export function validatePlan(input: unknown): Plan {
  if (!object(input)) throw new Error('Plan must be an object');
  keys(input, ['version', 'name', 'steps']);
  if (input.version !== 1 || !string(input.name) || !Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > 20) throw new Error('Invalid plan header or step count');
  let assertions = 0;
  for (const step of input.steps) {
    if (!object(step)) throw new Error('Invalid step');
    keys(step, ['action', 'target', 'value']);
    if (!actions.includes(step.action as string)) throw new Error('Unsupported action');
    if (String(step.action).startsWith('assert')) assertions++;
    if (step.action === 'assertUrl') { validateLocalUrl(step.value as string); if (step.target !== undefined) throw new Error('URL assertions have no target'); }
    else if (['reload', 'assertNoHorizontalOverflow', 'assertBodyScrollable'].includes(step.action as string)) { if (step.target !== undefined || step.value !== undefined) throw new Error('Built-in action has no target or value'); }
    else {
      if (!object(step.target)) throw new Error('Target required');
      keys(step.target, ['testId', 'role', 'name']);
      if (string(step.target.testId)) { if (step.target.role !== undefined || step.target.name !== undefined) throw new Error('Choose testId or role'); }
      else if (step.target.testId !== undefined || !roles.includes(step.target.role as string) || !string(step.target.name)) throw new Error('Use testId or supported role with exact name');
    }
    if (['fill', 'assertText'].includes(step.action as string) && (typeof step.value !== 'string' || step.value.length > 2000)) throw new Error('Value required');
    if (['click', 'assertVisible'].includes(step.action as string) && step.value !== undefined) throw new Error('Unexpected value');
  }
  if (!assertions) throw new Error('At least one assertion required');
  return JSON.parse(JSON.stringify(input)) as Plan;
}
export function validateLocalUrl(input: string): string {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol) || !['127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password) throw new Error('Only literal loopback HTTP(S) URLs are allowed');
  return url.href;
}
export function hashPlan(plan: Plan): string {
  const canonical = {version: plan.version, name: plan.name, steps: plan.steps.map(s => ({action:s.action, ...(s.target ? {target:{...(s.target.testId ? {testId:s.target.testId} : {role:s.target.role,name:s.target.name})}} : {}), ...(s.value !== undefined ? {value:s.value} : {})}))};
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
export function compareResults(before: RunResult, after: RunResult) {
  return { verified: before.planHash === after.planHash && !!before.executionHash && before.executionHash === after.executionHash && before.status === 'assertion_failed' && after.status === 'passed', before, after };
}
function locator(page: Page, target: Target): Locator { return target.testId ? page.getByTestId(target.testId) : page.getByRole(target.role as Parameters<Page['getByRole']>[0], {name:target.name, exact:true}); }
export async function runPlan(input: Plan, baseUrl: string, options: { outputDir: string; executablePath?: string; label?: string; timeoutMs?: number; viewport?: {width:number;height:number} }): Promise<RunResult> {
  const plan = validatePlan(input), url = validateLocalUrl(baseUrl);
  const result: RunResult = {planHash:hashPlan(plan), targetUrl:url, startedAt:new Date().toISOString(), status:'unverified', screenshots:[]};
  await mkdir(options.outputDir, {recursive:true});
  const timeoutMs = options.timeoutMs ?? 30000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) throw new Error('Run deadline must be 100–30000ms');
  const viewport = options.viewport ?? {width:375,height:812};
  if (![viewport.width,viewport.height].every(n=>Number.isInteger(n)&&n>=200&&n<=2000)) throw new Error('Invalid viewport');
  result.executionHash = createHash('sha256').update(JSON.stringify({semantics:1,viewport,timeoutMs,stepTimeout:2000,navigationTimeout:5000,browserPath:options.executablePath ?? 'playwright-default'})).digest('hex');
  let browser: Awaited<ReturnType<typeof chromium.launch>>;
  const runStarted = Date.now();
  try { browser = await chromium.launch({headless:true, timeout:timeoutMs, ...(options.executablePath ? {executablePath:options.executablePath} : {})}); }
  catch(error) { return {...result,error:error instanceof Error ? error.message : String(error)}; }
  result.browserVersion = browser.version();
  result.executionHash = createHash('sha256').update(`${result.executionHash}:${result.browserVersion}`).digest('hex');
  let context: Awaited<ReturnType<typeof browser.newContext>>;
  try { context = await browser.newContext({serviceWorkers:'block',viewport}); }
  catch(error) { await browser.close(); return {...result,error:error instanceof Error ? error.message : String(error)}; }
  let blocked = false, timedOut = false;
  const timer = setTimeout(() => { timedOut = true; void context.close().catch(() => {}); }, Math.max(1,timeoutMs - (Date.now()-runStarted)));
  let stepIndex = -1;
  try {
    await context.route('**/*', async route => {
      try { const requested = validateLocalUrl(route.request().url()); if(new URL(requested).origin !== new URL(url).origin) throw new Error('Origin changed'); await route.continue(); }
      catch { blocked = true; await route.abort(); }
    });
    // WebSocket requests do not pass through HTTP routing.
    await context.routeWebSocket('**/*', socket => { blocked = true; socket.close(); });
    const page = await context.newPage();
    page.setDefaultTimeout(2000);
    page.setDefaultNavigationTimeout(5000);
    page.on('popup', popup => { blocked = true; void popup.close(); });
    await page.goto(url, {waitUntil:'domcontentloaded'});
    for (const [index, step] of plan.steps.entries()) {
      stepIndex = index;
      validateLocalUrl(page.url());
      if (blocked || timedOut) throw new Error('Blocked request or run deadline');
      const target = step.target ? locator(page, step.target) : undefined;
      if (step.action === 'reload') await page.reload({waitUntil:'domcontentloaded'});
      else if (step.action === 'click') await target!.click();
      else if (step.action === 'fill') await target!.fill(step.value!);
      else {
        if (target && await target.count() !== 1) throw new Error('Assertion target must resolve to exactly one element');
        // Retry assertions briefly for UI rendering; assertion failure differs from action/navigation failure.
        let passed = false;
        const deadline = Date.now() + 2000;
        do {
          if (step.action === 'assertNoHorizontalOverflow') passed = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
          else if (step.action === 'assertBodyScrollable') passed = await page.evaluate(() => {
            const styles = [getComputedStyle(document.body), getComputedStyle(document.documentElement)];
            return styles.every(s => !['hidden','clip'].includes(s.overflowY)) && document.documentElement.scrollHeight > window.innerHeight;
          });
          else if (step.action === 'assertUrl') {
            const actual = new URL(validateLocalUrl(page.url()));
            const expected = new URL(step.value!);
            passed = actual.pathname + actual.search + actual.hash === expected.pathname + expected.search + expected.hash;
          } else if (step.action === 'assertVisible') passed = await target!.isVisible();
          else passed = await target!.count() === 1 && (await target!.textContent({timeout:500})) === step.value;
          if (!passed) await page.waitForTimeout(100);
        } while (!passed && Date.now() < deadline);
        if (!passed) { result.status = 'assertion_failed'; result.failureStep = index; result.error = 'Assertion did not match'; break; }
      }
    }
    if (!result.error) result.status = 'passed';
    const filename = `${options.label === 'before' ? 'before' : 'after'}.png`;
    await page.screenshot({path:resolve(options.outputDir, filename), fullPage:false, timeout:2000});
    result.screenshots.push(filename);
    if (blocked || timedOut) throw new Error('Blocked request or run deadline');
  } catch (error) { result.status = 'unverified'; result.failureStep = stepIndex; result.error = error instanceof Error ? error.message : String(error); }
  finally { clearTimeout(timer); try { await browser.close(); } catch { result.status='unverified'; result.error='Browser cleanup failed'; } }
  return result;
}
export { renderReport } from './report.js';
