# Keyword planning kit — local review candidate

Turn a keyword list into lexical groups and an editable content worksheet. Node 20+ is required; no install, API key, network request, or paid dependency is needed.

```sh
node plan.mjs examples/keywords.txt my-plan
```

Run from this directory. Supply a **new** output directory, which must have an existing parent. Output includes `clusters.csv`, `briefs.md`, and `summary.json`. Input is UTF-8 text with one keyword per line, 1–2000 unique keywords, up to 500 characters each. Case and duplicates are normalized. Optional third argument controls overlap threshold (>0 to 1; default 0.5). Lower values group more broadly. CSV uses CRLF, quotes every cell, and prefixes leading formula characters with an apostrophe.

The algorithm sorts normalized keywords and compares their non-stop-word token sets with each group's first keyword using Jaccard overlap. It does not use AI, synonyms, search results, search-volume estimates, keyword difficulty, or ranking predictions. Group anchors are alphabetical representatives, not proven pillar topics. English stop words are used; other languages need manual review. Some unrelated queries can share words and some related queries can share none. Review every group before planning content.

Examples contain synthetic coffee queries, not customer data. The checked-in example output can be regenerated from the repository root:

```sh
node packages/keyword-planner/plan.mjs packages/keyword-planner/examples/keywords.txt /tmp/keyword-plan-example
diff -r packages/keyword-planner/examples/output /tmp/keyword-plan-example
```

See [offer and fulfillment](../../docs/keyword-planning-kit.md) for the proposed $149 package and release gates. Price and demand are unvalidated. The repository MIT license applies; this code must not be described as exclusive proprietary software.
