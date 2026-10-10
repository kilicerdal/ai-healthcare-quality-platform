const { test, expect } = require('@playwright/test');
const { randomUUID } = require('crypto');

const { ClaimBuilder } = require('../../framework/builders/claimBuilder');
const { S3StorageClient } = require('../../framework/clients/s3Client');
const { SQSQueueClient } = require('../../framework/clients/sqsClient');
const { SQSClaimsProcessor } = require('../../app/sqsClaimsProcessor');
const { DatabaseClient } = require('../../framework/clients/databaseClient');

test('@e2e @regression @sqs Process healthcare claim through S3 and SQS', async ({ request }) => {
  const s3Client = new S3StorageClient();
  const sqsClient = new SQSQueueClient();
  const processor = new SQSClaimsProcessor(request);
  const databaseClient = new DatabaseClient();

  const claimData = new ClaimBuilder()
    .withMemberId(`MEM-${randomUUID()}`)
    .withProviderId('PRV-9001')
    .withDiagnosisCode('E11.9')
    .withClaimAmount(2250.75)
    .build();

  const fileName = `inbound/claims/${randomUUID()}.json`;

  // Upload claim to local S3
  await s3Client.uploadClaim(fileName, claimData);

  // Publish message to local SQS
  const sendResponse = await sqsClient.sendClaimMessage(fileName);

  expect(sendResponse.MessageId).toBeTruthy();

  // Consume SQS message and process claim
  const processedClaims = await processor.processMessages();

  // Find the claim created by this test
  const processedClaim = processedClaims.find(
    claim => claim.memberId === claimData.memberId
  );

  expect(processedClaim).toBeDefined();
  expect(processedClaim.status).toBe('RECEIVED');

  // Verify PostgreSQL
  const dbClaim = await databaseClient.getClaimById(processedClaim.claimId);

  expect(dbClaim).not.toBeNull();
  expect(dbClaim.member_id).toBe(claimData.memberId);
  expect(dbClaim.provider_id).toBe(claimData.providerId);
  expect(Number(dbClaim.claim_amount)).toBe(claimData.claimAmount);
  expect(dbClaim.status).toBe('RECEIVED');
});
