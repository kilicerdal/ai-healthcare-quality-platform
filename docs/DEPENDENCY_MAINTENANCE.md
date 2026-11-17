# Dependency maintenance

## Automated proposals

[Dependabot configuration](../.github/dependabot.yml): npm dependencies and the pip Moto simulator requirement weekly; Docker image references and GitHub Actions monthly. Moving image tags such as `latest` can change without a Dependabot PR; review and test them separately.

New configurations limit open version-update PRs to three per application ecosystem and two per monthly ecosystem. Security-update handling is separate from these version-update limits. Scheduling a check does not guarantee an update is available or that a hosted update job succeeds; inspect Dependabot logs and PRs on GitHub.

## Review before merging

1. Read upstream release notes, advisories, license changes and breaking changes. Check supported Node/Python versions and changes to install scripts.
2. Keep related manifest/lockfile changes together. Preserve third-party notices. A bot PR is a proposal, not approval to merge or publish a new release.
3. Run the relevant checks below and investigate failures without weakening business assertions. Do not automatically accept generated visual baselines or rewrite historical passing evidence.
4. Merge only after review. If behavior or dependencies changed, record fresh verification before a release. Keep the old release evidence tied to its original commit.

```sh
npm ci
npm run test:unit
npm run demo:up
npm run demo:test
npm run demo:down
```

Run the deterministic AI validation selection listed in `.github/workflows/playwright.yml` as well. Model-dependent AI tests are separate. For browser changes, install the matching Playwright browsers if needed; for Moto or Docker changes, rebuild and verify simulated S3/SQS redelivery and database idempotency. Use only local demo credentials and synthetic inputs.

No automatic merge is configured by these files. Never attach API keys, real customer data, local databases or raw sensitive traces to a PR. Dependency checks do not require paid model calls or production cloud access.
