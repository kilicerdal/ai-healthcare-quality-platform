# Evidence provenance

Documentation review: **2026-11-17**. This date records a documentation/source review, not a rerun of every example.

## Read the labels

- **Current CI** means the workflow outcome for the specific commit shown in Actions. A moving badge is not an immutable release record.
- **Recorded local** means a saved execution under its original environment and date; a screenshot never reruns itself.
- **Historical release** means evidence for an older version. Its count and dependency versions must not be rewritten to resemble current CI.
- **Authored / deterministic** means an intentionally specified scenario or fixture. It is not a newly generated model output.
- **Recorded model experiment** means calls made under the saved protocol; it does not prove live provider availability or general accuracy.

[Current Actions runs](https://github.com/kilicerdal/ai-healthcare-quality-platform/actions?query=branch%3Amain) · [Reviewer journey](REVIEWER_GUIDE.md) · [Supported setup](MAINTENANCE.md).

## Recorded evidence inventory

| Item | Label and scope | Inspect |
|---|---|---|
| Screenshot, sample HTML ZIP and captioned walkthrough | Recorded local, November 3, 2026; eight selected deterministic AI-validation tests, not full regression or live Ollama | [Screenshot](images/ai-validation-report.jpg), [ZIP](samples/ai-validation-report.zip?raw=true), [recording](media/walkthrough.webm?raw=true) |
| Earlier Docker CI citation | Historical CI run; not a claim about the latest main revision | [Run 41663498497](https://github.com/kilicerdal/ai-healthcare-quality-platform/actions/runs/41663498497) |
| Current Docker/regression results | Per-commit CI summaries/logs; suite selections overlap and totals are executions rather than coverage | [Automation workflow](../.github/workflows/playwright.yml), [Docker demo workflow](../.github/workflows/demo-environment.yml) |

The selected November 3 report predates later input-boundary, retry/conflict and schema controls. It remains a demonstration of its eight recorded validators, not evidence that those later controls ran. Its capture commit was not recorded in the sample description; do not invent one. Use the current workflow for current behavior and regenerate local reports with `npm run demo:test`.

## Immutable documentation snapshot

[Files as reviewed at `2c63f5718bf2`](https://github.com/kilicerdal/ai-healthcare-quality-platform/tree/2c63f5718bf2b05c6710eaca4a5b61bd223539d4). This identifies the containing source snapshot, not an inferred capture commit. Historical artifacts are preserved unchanged.
