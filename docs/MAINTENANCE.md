# Compatibility, verification and dependency policy

## Supported setup

Node.js 24, Docker Engine with Compose 2 or newer, PostgreSQL 17 and Moto 5.2.5. The standalone simulator requires Python >=3.10 (CI uses 3.13). Default loopback ports are 3000, 5432 and 5000; use MOTO_PORT if 5000 is occupied.

From a fresh checkout at the repository root, after installing those prerequisites:

```sh
npm ci && npm run demo:up
```

Python examples use POSIX virtual-environment paths; Windows uses `.venv\Scripts\python.exe`.

## Quick check and complete validation

Quick, bounded check:

```sh
DB_USER=postgres DB_PASSWORD=local-demo-only npm run test:smoke -- --workers=1
```

Complete deterministic checks:

```sh
npm run test:unit
npm run demo:test
```

[Architecture](../README.md#architecture) · [Evidence and reproduction](../docs/ENGINEERING.md). S3/SQS are simulated with Moto. Demo credentials and claims are synthetic. The regression command excludes @ai tests; CI separately selects eight deterministic AI-validator checks. The full AI directory is not a promise of live-provider verification. Stop only your own stack with npm run demo:down; normal shutdown preserves the database volume.

Commands resolve pinned requirements/lockfiles where supplied. A runtime major or supported Python floor is a deliberate compatibility decision, not an automatic dependency update. Container major/patch tags can receive upstream updates unless an exact version is stated; this is not a bit-for-bit image reproducibility claim.

## Update decisions

Review recorded: **2026-11-17**. This is a policy review date, not a claim that every optional live integration was rerun that day. Current hosted execution appears in Actions; historical counts retain their dates and source identifiers.

| Update | Decision | Reason |
|---|---|---|
| [Node 26 container, PR #1](https://github.com/kilicerdal/ai-healthcare-quality-platform/pull/1) | Declined under current runtime policy | Local setup, CI and the Docker application currently support Node 24. A runtime-major migration must update and validate them together. |

Dependabot checks application/tool dependencies weekly and GitHub Actions monthly. Updates are reviewed in PRs and are not auto-merged. Monthly, review deferred PRs, runtime support, security advisories and the oldest open genuine defects. Record the tested version and run link before changing a compatibility boundary. Remove an ignore rule when its migration is approved; do not keep it silently forever. Security fixes may require raising a runtime floor rather than bypassing tests.

A green CI badge describes that workflow's current result, not a security, accessibility or production-readiness certification. Framework and license badges identify tools/terms, not test results. Do not publish a static passing test-count badge without a dated run.
