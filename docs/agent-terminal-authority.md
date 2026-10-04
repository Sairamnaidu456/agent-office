# Agent terminal authority

The founder authorizes the CEO and all assigned office agents to perform terminal engineering and monitoring without routine confirmation. AGENTS.md is the shared source of authority; CLAUDE.md imports it. Include it in task prompts for agents that do not automatically read repository instructions. Existing live agents must read the updated directive; a file edit does not inject instructions into a running conversation.

Authorized operations include git fetch/pull in clean isolated worktrees, branch creation, dependency installation, implementation, checks, local server management, worker/ticket administration, commits, pushes and PR creation. The CEO may delegate this authority. Preserve shared work and other sessions' processes. Use git fetch and a separate worktree instead of pulling into the dirty shared checkout.

## Codex workers

For founder-authorized office workers, use Codex Full access where permitted: `sandbox_mode = "danger-full-access"` and `approval_policy = "never"`. When launching the office with Codex as its configured default provider, the existing agent-args option can supply the settings:

```sh
agent-office --agent codex --agent-args '-s danger-full-access -a never'
```

These arguments apply to the configured provider; they do not configure other providers or retroactively change already-running workers. Check the actual launch settings before claiming full access. `.agent-office/codex-permissions.json` alone is not evidence that the launcher applies a permission mode.

Official OpenAI documentation describes sandbox and approval modes: https://learn.chatgpt.com/docs/sandboxing . Managed requirements and OS permissions may restrict them. Agents must follow platform-required approval flows and explain the source; do not ask a second conversational question for an already-authorized command.

## Continuing work

After restart or handoff, reuse the founder's standing engineering authorization. Ask only for missing scope or separately reserved actions. Maintain the $100 budget ceiling. Spending, financial custody, external messaging, public deployment, legal/account creation and private-service exposure keep their action-specific approval gates. This directive does not grant OS root or permission to discard another session's changes.
