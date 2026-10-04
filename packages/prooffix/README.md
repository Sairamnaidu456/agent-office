# ProofFix pilot

Local evidence for a specific browser bug: freeze one declarative plan, reproduce an assertion failure before a repair, then run precisely the same plan after. This prototype does not invoke AI, edit code, process payments, or claim comprehensive correctness. Use your existing AI agent to draft the plan with the `prompt` command, then review it.

From the repository with existing dependencies:

```sh
node --import tsx packages/prooffix/src/cli.ts prompt
CHROME_PATH=/path/to/chrome node --import tsx packages/prooffix/src/cli.ts verify plan.json http://127.0.0.1:3000 http://127.0.0.1:3001 /private/tmp/prooffix-evidence
```

For the standalone package, run `npm install` in its directory, then `npm run prompt`, `CHROME_PATH=/path/to/chrome npm run demo`, or `npm run proof -- plan.json BEFORE_URL AFTER_URL OUTPUT_DIR`. Installation downloads the pinned runtime dependencies; browser installation remains separate. The `plan.schema.json` describes the input format, and runtime validation additionally enforces parsed URL restrictions.

If CHROME_PATH is omitted, Playwright's existing browser installation is used. No browser is downloaded automatically. The output contains escaped, portable report.html, result.json, and screenshots. Exit codes: 0 verified, 2 unverified, 1 invalid input or setup failure.

```json
{"version":1,"name":"Closing dialog unlocks scrolling","steps":[{"action":"click","target":{"testId":"open"}},{"action":"click","target":{"testId":"close"}},{"action":"assertBodyScrollable"}]}
```

Supported actions: click, fill (value), reload. Targets use either testId or a supported role with exact accessible name. Supported roles: button, textbox, link, dialog, heading, checkbox, combobox, alert, status. Assertions: assertVisible, assertText (exact value), assertUrl (path/query/hash), assertNoHorizontalOverflow, assertBodyScrollable. Scrollability requires a page taller than its viewport and no hidden/clip overflow on body or html. There are no arbitrary scripts or selectors. Maximum 20 steps, 2-second steps, 5-second navigation, and a 30-second run deadline including launch (cleanup can take longer). Screenshots use a 375×812 mobile viewport. Programmatic viewport overrides must be 200–2000 pixels per dimension.

Only literal loopback HTTP(S) addresses 127.0.0.1 and [::1] are accepted. Requests outside the target origin (including other local ports), WebSockets, and popups invalidate verification; service workers are disabled. External assets must be served from the target origin. This is a browser-network restriction, not an OS sandbox: use only trusted local applications and an isolated browser installation. Local endpoints can have side effects. Run against disposable test data.

Verification requires matching normalized plan and execution configuration hashes, an assertion failure before, and a full pass after. Execution hashes include viewport, timeouts, assertion semantics version, browser path and actual browser version. The report records target URLs and run timestamps. Missing or ambiguous assertion targets, navigation errors, action timeouts, blocked requests, and failed screenshots are unverified. Missing-element assertions therefore cannot prove a repair in this pilot; prefer a stable status element with differing text or built-in geometry assertions. A passing before run does not prove reproduction. Report results are unsigned local artifacts and should be retained with the source versions under test.
