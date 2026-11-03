# Healthcare reliability: interview walkthrough

## Follow a claim

A synthetic claim is uploaded to simulated S3. A queue message identifies its object key and bucket. The processor reads the object, submits it to the claims API, verifies HTTP 201, and only then acknowledges the queue message. The API writes to PostgreSQL using parameterized SQL.

## Explain a failure

Before this change, a malformed first message stopped the batch. Now each message is handled independently: valid later messages can complete, failed messages remain unacknowledged, and an aggregate error reports partial progress. Unit tests inject failing queue/storage/API dependencies so these cases are deterministic.

A missing S3 object never reaches the API. An API error or connection failure never acknowledges the message. An acknowledgement failure is reported even if the API already persisted the claim.

## Explain the tradeoff

Continuing the batch improves progress, but does not provide exactly-once delivery. A failure between database persistence and queue acknowledgement can duplicate a claim on retry. A production design needs idempotency keys, retry limits, a dead-letter queue, monitoring, and an operational replay policy. These capabilities are not claimed by this project.

## Explain test isolation

The queue ingestion test owns a unique queue. Its synthetic member ID identifies the records it may delete; cleanup cannot delete arbitrary members. S3 and database cleanup runs even if assertions fail. The overall suite still expects an isolated non-production database.

## Explain AI boundaries

The validators accept only supported endpoint/status combinations and approved rules. An empty batch or malformed scenario cannot be counted as successful validation. Rule lookup checks own properties so JavaScript prototype property names cannot be mistaken for supported business rules. The model proposes scenarios; deterministic code decides which ones are supported.

## Demonstrate

1. Run `npm run test:unit` for model-independent failure cases.
2. Start `npm run demo:up` and run `npm run demo:test`.
3. Open the report and inspect the queue ingestion test.
4. Discuss one tested failure and the remaining idempotency limitation.
