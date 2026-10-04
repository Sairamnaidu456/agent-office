# Creative team console

Open Creative team in the office or visit `/creative.html`. The page shows Creative Lead, Office Engineer and Creative QA using actual worker IDs from `.agent-office/team.json`: `creativeLead`, `internalEngineer` and `qa`. Avatar names remain the office-generated names. An unassigned role shows “No desk assigned”; status is reported by the server, not inferred readiness.

The page requires an administrator session and the Boss controls in the running release (`GET /api/boss/state`, `POST /api/boss/tickets`). If those controls are absent it reports the failure; it does not simulate workers or successful ticket delivery. Tickets go to the mapped internalEngineer, stay separate from the project board, and display delivery errors and verification notes. The team and ticket controls are a companion to the existing Boss implementation and require that implementation to be installed.

Employee access uses the existing authenticated account WebSocket handlers. Admins can create single-use member/admin invites, cancel invites, change roles and revoke accounts. Member is the default invite role. The page never puts employee names or notes into HTML. Copy invitation URLs privately. Shared-password sessions retain existing admin privileges; use individual accounts when adding employees. Agent launch permissions are separate from employee account roles. The existing Accounts settings control shared login.

Updates refresh every ten seconds while the page is visible; the page does not keep workers running or install an unattended service. Revenue targets are goals; no buyer evidence or payment is claimed. The $100 ceiling and external-action approval gates remain.

Local rollout: copy the reviewed `creative.html` and `creative.js` build artifacts into the current office public directory and add the same Creative team link to its index/lite entry pages, preserving existing assets. Existing APIs require no restart for this page. A page refresh picks up the addition. This is local only, not public deployment.
