# Contributing

## Set up and check

Use Node.js 24 and Docker with Compose v2. Follow [the README](README.md#one-command-demo-environment) for local ports and prerequisites.

```sh
npm ci
npm run test:unit
npm run demo:up
npm run demo:test
npm run demo:down
```

Stopping the environment preserves its PostgreSQL volume. Do not delete existing volumes or another person's running services. Use only the local demo credentials. Run the deterministic AI validation selection documented in [.github/workflows/playwright.yml](.github/workflows/playwright.yml); the broader model-dependent AI suite requires a separate local Ollama setup and is not implied by an offline pass.

## Keep boundaries clear

Use synthetic claims and identifiers only. Moto simulates AWS S3/SQS; do not replace its endpoints with a production account. Test expected business behavior, persisted data and queue outcomes independently. Preserve the redelivery/idempotency contract: a committed retry returns the original claim, while changed content with the same identity conflicts.

Add meaningful regression tests for behavior changes. Keep application interactions in the appropriate clients/helpers and assertions in tests. Do not hide failures by relaxing the business rule or treating unavailable services as a passing result.

Never commit .env files, real credentials, patient data, database dumps or raw sensitive logs. Label authored AI examples, deterministic checks and live model experiments separately. Review any generated evidence before publication.

## Pull requests

Describe the concrete problem, resulting behavior, commands run, and remaining limitations. Changes to dependencies or containers need the affected integration journey, not only unit checks. [Engineering decisions](docs/ENGINEERING.md) · [Dependency maintenance](docs/DEPENDENCY_MAINTENANCE.md) · [Security reporting](SECURITY.md).

Original code is MIT licensed; retain third-party notices. Documentation-only changes should verify links and commands without claiming a fresh full regression.
