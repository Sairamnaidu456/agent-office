# Operations monitor

Sign in to the office, then open `/operations` on the same server. This read-only monitor refreshes every ten seconds and offers manual refresh. `/api/operations` returns the same observations as JSON and requires the existing office session.

Each open floor shows queue counts, queue pause state, seated workers, task outcomes and recorded errors. A warning identifies a running task whose worker is no longer seated. Finished includes stopped and failed processes; it does not establish a merged pull request or validated deliverable.

A failed refresh preserves the last observation with a stale-data warning and timestamp. Session expiration requires signing in again through the office. Prompts, terminal output, checkout paths and account identifiers are omitted. Task titles and recorded errors are visible to signed-in office users.

The monitor does not start workers or change queues. It does not measure revenue, payment readiness or provider billing. Use office queues and worker terminals to act on issues.
