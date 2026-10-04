# Keyword planning toolkit: first revenue experiment

Status: local review candidate. Sales, customer validation, checkout, external distribution, and net revenue are all unverified. The toolkit is a bounded replacement for untracked ClusterSEO prototype claims, with no invented search metrics or claims of AI or ranking improvements.

Proposed offer: **$149 one-time agency content planning starter kit**. Include the offline runner, reproducible synthetic sample, editable briefs, a review checklist, and written setup guidance. Buyers would pay for the prepared workflow and guidance; the underlying code remains MIT licensed. No exclusivity, resale restriction, customer support SLA, or lifetime service obligation has been established. Demand and willingness to pay remain hypotheses.

The intended buyer is a small content agency already collecting its own keyword lists and wanting an editable first draft for a human planner. Seven purchases would equal $1,043 gross; fees, refunds, taxes, fulfillment effort, and net proceeds must be recorded separately. This is target arithmetic, not a forecast or earned income. The first $1,000 milestone must use verified net receipts reconciled to actual provider settlements, excluding demo ledger entries.

## Local delivery and download preparation

From the repository root:

```sh
node packages/keyword-planner/plan.mjs packages/keyword-planner/examples/keywords.txt /tmp/client-plan
zip -r /tmp/keyword-planning-kit.zip packages/keyword-planner docs/keyword-planning-kit.md LICENSE
unzip -l /tmp/keyword-planning-kit.zip
```

The archive paths preserve the relative documentation link. Zip creation is local preparation only. The runner writes to a fresh directory and refuses to overwrite prior outputs. No input leaves the machine. The office application does not load this standalone package; no server route or registry is required.

## Human fulfillment checklist

1. Confirm the buyer can run Node 20+, the one-time scope, usage/license terms, and limitations before sale.
2. Buyer supplies their own authorized keyword list locally; no scraping or customer credentials are needed.
3. Review lexical clusters, separate different intents, merge genuine synonyms, and remove irrelevant queries.
4. Review current search results and existing site pages; write audience, evidence, outline, owner, and approval into briefs. Do not invent demand or promise SEO performance.
5. Check the archive opens, run the synthetic example, and provide the stated guidance. Track actual fulfillment effort and feedback.

## Validation and release gates

Growth staff prepare a demo and interview questions locally: How are keyword lists grouped today? What takes time? What would make this worksheet useful? Would $149 for the stated package be acceptable? Record observations, refusals, and commitments distinctly. A suggested test is five qualified interviews followed by an explicit purchase test, each external action requiring the founder's specific approval. Set a stop decision after the test if there is no credible demand; do not scale on synthetic evidence.

Before an external launch, the founder must approve the exact channel, offer copy, fulfillment terms, and checkout provider. Provider setup requires founder-owned identity, payout details, eligibility review, and actual onboarding; this repository creates no wallet or payment account. No external communications, registrations, publication, or payments occur as part of this local kit. Current provider requirements and fees need verification at that approval stage.

Verification: the automated CLI test checks grouping, duplicate normalization, deterministic results, CSV formula neutralization, bad-threshold rejection, and refusal to overwrite existing deliverables. Root typecheck, test, and build remain the office integration gates.
