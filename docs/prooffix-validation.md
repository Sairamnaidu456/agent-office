# ProofFix pilot validation — 2026-10-04

## What ran

The repository's typecheck and build passed. Standard `npm test` ran 611 tests: 610 passed, one browser-specific test was intentionally skipped there and run separately. Strict standalone TypeScript checks covered the package engine, CLI, demo and report renderer.

`PROOFFIX_BROWSER_TESTS=1 node --import tsx --test tests/prooffix.test.ts` passed five tests including the browser evaluation. Three known fixtures (save persistence, modal scrolling, horizontal overflow) were tested in three repeated broken/fixed pairs: 9/9 pairs failed an assertion before and passed the unchanged plan after. Negative controls rejected changed plans, changed viewport/configuration, both-good/both-broken statuses, unavailable targets and missing selectors. Runtime in that run ranged from 3.846 to 12.385 seconds per fixture pair including screenshot collection; these are local measurements, not performance promises. The unavailable target used a browser-rejected unsafe port and confirmed conservative navigation-error handling.

The plain Playwright baseline also completed the form case correctly. There is no demonstrated functional superiority over Playwright, no customer demand evidence, and no AI model inference benchmark. The runner executes explicit plans; exported prompts can be used with the user's existing coding agent.

The three-case demo passed from the repository. Desktop and mobile screenshots of the final report were captured and inspected; embedded screenshots loaded. Standalone installation and demo are checked before packaging; release notes record the final result. No paid API calls, sales, customer accounts, or provider payouts were performed in this evaluation.

## Limits and next gate

These deliberately constructed examples establish basic runner mechanics only. They do not test arbitrary applications, authenticate report contents, prove source-code identity, or establish that a browser app is correct. Reports and screenshots are unsigned local artifacts. User-defined expected behavior remains necessary. Unsupported/missing targets report unverified.

Before paid expansion, acquire five independent user trials and compare setup effort to the users' existing free workflows. Require an actual usable paid feature and verified seller account before accepting money. Keep revenue at zero until genuine payments and payout evidence exist. A public prerelease is a free technical pilot, not a paid launch.
