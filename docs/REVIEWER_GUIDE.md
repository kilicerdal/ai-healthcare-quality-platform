# Reviewer journey

## What this demonstrates
A claim can commit before its queue acknowledgement succeeds. Redelivery must return the original claim; changed content at the same object identity must conflict. This tests API, PostgreSQL and simulated S3/SQS boundaries, not clinical decisions or real payments.

## Choose a path

| Goal | Path | Requirements |
|---|---|---|
| Inspect without installing | [Recorded walkthrough](media/walkthrough.webm?raw=true) and [evidence scope](EVIDENCE.md) | Browser; historical selected report |
| Reproduce integration checks | Docker demo below | Node 24/npm, running Docker engine with Compose v2 |
| Change implementation | [Manual developer setup](../README.md#local-setup) | Locally initialized PostgreSQL/Moto/API |
| Exercise a live model | [Optional AI setup](../README.md#ai-assisted-testing) | Separate local Ollama configuration; not part of the default demo |

```sh
npm ci
npm run test:unit
npm run demo:up
npm run demo:test
npx playwright show-report
# When finished:
npm run demo:down
```

Use disposable local services and free ports 3000, 5000 and 5432. [Alternate Moto port and isolated Compose projects](../README.md#one-command-demo-environment). Stopping keeps the database volume.

## Inspect the failure contract
Open the SQS ingestion tests in the HTML report. Check that acknowledgement failure preserves the committed claim, identical redelivery returns its original identity, and changed content returns HTTP 409. Ordinary smoke success alone does not prove redelivery correctness. [Source-level case study](ENGINEERING.md).

## AI and safety boundary
Default assertions, scenario validators and CI are deterministic. Optional AI generates suggestions; it does not define business truth. The demo uses synthetic records, explicit local credentials, loopback host bindings and Moto. Demo credentials are not production authentication; simulator behavior is not proof of AWS IAM, availability or delivery behavior in a real account. Do not expose these services publicly. [Security](../SECURITY.md) · [Maintenance](MAINTENANCE.md).

[How this project complements the portfolio](https://github.com/kilicerdal/eai-engineering/blob/main/docs/PROJECTS.md).
