const { randomUUID } = require("node:crypto");
const { readFileSync, mkdirSync, writeFileSync } = require("node:fs");
const { execFileSync } = require("node:child_process");
const assert = require("node:assert/strict");
const { Pool } = require("pg");
const { request } = require("@playwright/test");
const { S3Client, CreateBucketCommand, DeleteBucketCommand } = require("@aws-sdk/client-s3");

// A fresh test schema and a separately started loopback Moto server. Never use real AWS credentials.
process.env.LOCAL_AWS_ENDPOINT = "http://127.0.0.1:4311";
process.env.DB_HOST = "127.0.0.1";
process.env.DB_PORT = "55432";
process.env.DB_NAME = "eai_quality";
process.env.DB_USER = "eai_demo";
process.env.DB_PASSWORD = "eai_demo";
process.env.AWS_EC2_METADATA_DISABLED = "true";
const schema = "health_test_" + randomUUID().replaceAll("-", "");
process.env.DB_SCHEMA = schema;
const { localAWSConfig } = require("../framework/config/localEndpoints");
const { S3StorageClient } = require("../framework/clients/s3Client");
const { SQSQueueClient } = require("../framework/clients/sqsClient");
const { ClaimsProcessor } = require("../app/claimsProcessor");
const { SQSClaimsProcessor } = require("../app/sqsClaimsProcessor");
const app = require("../app/server");
const pool = require("../app/db");
const admin = new Pool({ host: "127.0.0.1", port: 55432, database: "eai_quality", user: "eai_demo", password: "eai_demo", max: 1 });
const sdk = new S3Client({ ...localAWSConfig(), forcePathStyle: true });
let server, context, queue, storage;
const memberId = "SYNTHETIC-" + randomUUID();
const objectKey = "synthetic/" + randomUUID() + ".json";
const input = { memberId, providerId: "SYNTHETIC-PROVIDER", serviceDate: "2026-11-06", diagnosisCode: "DEMO", claimAmount: 125.5 };
const observations = [];
const snapshot = async () => {
  const result = await pool.query("SELECT count(*)::integer AS records, min(claim_amount)::float AS amount FROM claims WHERE member_id=$1", [memberId]);
  return result.rows[0];
};
(async () => {
  try {
    const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim();
    if (dirty) throw new Error("Commit the capture implementation first so its source pin is exact");
    const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await pool.query(readFileSync("docker/init.sql", "utf8"));
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    process.env.CLAIMS_API_URL = `http://127.0.0.1:${server.address().port}`;
    context = await request.newContext({ timeout: 10000 });
    await sdk.send(new CreateBucketCommand({ Bucket: "healthcare-claims-local" }));
    storage = new S3StorageClient();
    queue = await SQSQueueClient.createIsolatedQueue("story-" + randomUUID());
    await storage.uploadClaim(objectKey, input);
    let firstId;
    const adapter = { post: async (url, options) => {
      assert.equal(url, process.env.CLAIMS_API_URL + "/api/claims");
      const response = await context.post(url, options);
      const body = await response.json();
      if (response.status() === 201) firstId ??= body.claimId;
      observations.push({ operation: "POST /api/claims", status: response.status(), sameClaimAsFirst: body.claimId ? body.claimId === firstId : null });
      return { status: () => response.status(), json: async () => body };
    } };
    const failedAck = Object.create(queue);
    failedAck.deleteMessage = async receipt => { await queue.releaseMessage(receipt); throw new Error("Injected acknowledgement loss after persistence"); };
    await queue.sendClaimMessage(objectKey);
    await assert.rejects(new SQSClaimsProcessor(adapter, { sqsClient: failedAck }).processMessages(), AggregateError);
    const afterFirst = await snapshot();
    assert.equal(afterFirst.records, 1);
    const retried = await new SQSClaimsProcessor(adapter, { sqsClient: queue }).processMessages();
    assert.equal(retried.length, 1);
    assert.equal(retried[0].claimId, firstId);
    const afterReplay = await snapshot();
    assert.deepEqual(afterReplay, afterFirst);
    await storage.uploadClaim(objectKey, { ...input, claimAmount: input.claimAmount + 10 });
    await queue.sendClaimMessage(objectKey);
    await assert.rejects(new SQSClaimsProcessor(adapter, { sqsClient: queue }).processMessages(), AggregateError);
    const afterChanged = await snapshot();
    assert.deepEqual(afterChanged, afterFirst);
    assert.deepEqual(observations.map(o => o.status), [201, 201, 409]);
    const record = {
      schemaVersion: 1, capturedAt: new Date().toISOString(), origin: "authored-synthetic-local-capture", backend: "postgres", simulator: "Moto", modelCalls: 0, realAWSCalls: 0,
      source: { repository: "https://github.com/kilicerdal/ai-healthcare-quality-platform", commit },
      setup: "Synthetic claim, local S3/SQS simulation, disposable PostgreSQL schema. Acknowledgement loss is deliberately injected; visibility is released immediately to make redelivery deterministic.",
      observations,
      stages: [
        { id: "ack-loss", title: "Stored, but not acknowledged", apiStatus: observations[0].status, persistedClaims: afterFirst.records, storedAmount: afterFirst.amount, acknowledgement: "injected-failure", sameClaimAsFirst: true },
        { id: "redelivery", title: "Delivered again, same claim", apiStatus: observations[1].status, persistedClaims: afterReplay.records, storedAmount: afterReplay.amount, acknowledgement: "succeeded", sameClaimAsFirst: observations[1].sameClaimAsFirst },
        { id: "changed-object", title: "Same object key, changed content", apiStatus: observations[2].status, persistedClaims: afterChanged.records, storedAmount: afterChanged.amount, acknowledgement: "withheld-after-api-conflict", sameClaimAsFirst: null },
      ],
      safety: "Synthetic data only. Claim amounts are input values, not payments. Received does not mean approved or paid. No patient identifiers, credentials, receipt handles, queue URLs or connection strings are included.",
      reproduction: "Start local Moto on 127.0.0.1:4311 and the disposable eai_quality PostgreSQL lab on 55432; run npm run showcase:capture.",
    };
    const json = JSON.stringify(record, null, 2) + "\n";
    assert.ok(!json.includes(memberId) && !json.includes(objectKey));
    mkdirSync("artifacts", { recursive: true });
    writeFileSync("artifacts/claim-redelivery.json", json);
    console.log("Captured actual Moto/API/PostgreSQL redelivery: 201, 201, 409; one claim persisted throughout. No real AWS or model calls.");
  } finally {
    if (queue) await queue.deleteQueue();
    if (storage) await storage.deleteClaim(objectKey);
    try { await sdk.send(new DeleteBucketCommand({ Bucket: "healthcare-claims-local" })); } catch { /* Other local simulator objects, if any, are not removed. */ }
    sdk.destroy();
    if (context) await context.dispose();
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
