# Creative office team

A dedicated team focuses on office bugs, features, employee access and revenue experiments based on office improvements. Creative Product Lead scopes problems; Internal Engineer implements isolated PRs; Creative QA verifies security and behavior. Session agents are temporary; this charter does not install persistent desks or unattended execution.

Work one bounded issue per engineer through internal tickets. Each ticket needs evidence, owner, acceptance criteria, checks and PR URL. Preserve existing workers. The $100 cap remains; unknown metering is not zero cost. Spending, publication, deployment and outbound messages need specific approval. Revenue requires actual payment evidence.

## Access API

Authenticated tools call `GET /api/access` for current identity and `capabilities.manageAccounts`. Admins can call `GET /api/access/accounts` for account and invite state, and `POST /api/access/invites` with application/json:

```json
{"action":"create","role":"member","name":"Ada"}
```

Names are optional, up to 24 characters; roles must be explicit admin or member. Invites retain seven-day expiry and single-use redemption. Cancel with `{"action":"cancel","inviteId":"..."}`. Tokens are secrets. Existing UI/CLI handles role changes and revocation. Shared-password sessions retain admin privileges; onboard employees with individual member accounts and disable shared login after creating your own admin account.

## Backlog

1. Account capabilities and admin invite API (this PR).
2. Audit all host-command and founder-directive routes for admin enforcement before onboarding employees. Shared-checkout workstation routes currently require login only; those uncommitted files are outside this PR.
3. Define and enforce worker ownership for terminal viewing, prompting, hiring and stopping across floors.
4. Prepare an Agency Office Starter demo derived from proven access and onboarding features. Validate with three qualified agencies reporting the problem and one paid pilot commitment before commercial expansion. No sales or demand claimed.
