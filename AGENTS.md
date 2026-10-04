# agent-office

- Ship every code change as a PR branched from freshly fetched `origin/main`, and end with the PR URL instead of stopping at a local commit or asking first.
- The main checkout is shared with other live sessions and board agents, so do branch work in a worktree and never stash, reset or commit anyone else's changes there.
- Verify with `npm run typecheck`, `npm test` and `npm run build`, plus a headless-browser screenshot for visual changes, rather than slow manual playthroughs.
- When a change affects how people run, deploy or use the office, update `README.md` and the matching `docs/*.md` page in the same PR.
- New features plug in through the registries as modules of their own (see `docs/code-layout.md`), never by adding their code to `main.ts`, `server.ts`, the state store, `protocol.ts` or another feature's files, and `tests/size.test.ts` must stay green.
- Every modal needs a top-right ✕, and closing it by ✕ or Esc must put the player straight back into mouse-look with no extra click.
- When asked to merge PRs, merge only webdevcody's (anyone else's only when linked, after a security review), resolve conflicts so both sides survive, and squash-merge.

## Founder terminal authority — 2026-10-04

The founder grants standing authorization to the CEO and all office agents (including Lead, Internal Engineer, Creative Product Lead and QA) to run terminal commands needed for assigned office work without routine confirmation. This includes repository reads, git fetch/pull in isolated clean worktrees, worktree/branch creation, implementation, dependency installation, tests/builds, local server management, monitoring, worker/ticket administration, commits, pushes and PR creation. The CEO may delegate the same engineering authority and monitor worker terminals. Act on this authorization; do not ask again merely because a command uses git, network access or a terminal. Include this directive in worker/task handoffs.

Preserve other sessions' files, branches and processes. Never pull into the shared dirty checkout or discard someone else's work. Maintain the $100 ceiling. Existing action-specific approval requirements for spending/moving money, public deployment, external messages, legal/account creation and exposing private services remain. Terminal authority does not turn those actions into routine engineering.

Use Codex Full access for authorized office workers where the runtime permits it: sandbox_mode = "danger-full-access", approval_policy = "never". Instructions are authorization, not OS root or a runtime permission switch. Honor enforced OS/platform restrictions; if a tool requires an approval, use its required flow and explain that the platform requires it, without adding a second conversational confirmation. After interruptions, reuse standing authorization rather than asking again for an already-authorized operation.
