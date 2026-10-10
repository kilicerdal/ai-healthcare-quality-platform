const { test, expect } = require('@playwright/test');
const { randomUUID } = require('crypto');

const { ClaimBuilder } = require('../../framework/builders/claimBuilder');
const { S3StorageClient } = require('../../framework/clients/s3Client');
const { ClaimsProcessor } = require('../../app/claimsProcessor');
const { DatabaseClient } = require('../../framework/clients/databaseClient');

test('@e2e @regression @s3 @database Process healthcare claim from S3 to PostgreSQL', async ({ request }) => {

  const s3Client = new S3StorageClient();
  const claimsProcessor = new ClaimsProcessor(request);
  const databaseClient = new DatabaseClient();

  // Step 1: Generate synthetic claim data
  const claimData = new ClaimBuilder()
    .withMemberId('MEM-9001')
    .withProviderId('PRV-9001')
    .withDiagnosisCode('E11.9')
    .withClaimAmount(1850.75)
    .build();

  // Step 2: Generate unique filename
  const fileName = `inbound/claims/${randomUUID()}.json`;

  // Step 3: Upload claim to local S3
  const uploadResponse = await s3Client.uploadClaim(
    fileName,
    claimData
  );

  expect(uploadResponse.$metadata.httpStatusCode).toBe(200);

  // Step 4: Process claim from S3
  const processedClaim = await claimsProcessor.processClaim(fileName);

  expect(processedClaim.claimId).toBeTruthy();
  expect(processedClaim.status).toBe('RECEIVED');

  // Step 5: Verify PostgreSQL record
  const dbClaim = await databaseClient.getClaimById(
    processedClaim.claimId
  );

  expect(dbClaim).not.toBeNull();

  // Step 6: Validate database fields
  expect(dbClaim.claim_id).toBe(processedClaim.claimId);
  expect(dbClaim.member_id).toBe(claimData.memberId);
  expect(dbClaim.provider_id).toBe(claimData.providerId);
  expect(dbClaim.diagnosis_code).toBe(claimData.diagnosisCode);
  expect(Number(dbClaim.claim_amount)).toBe(claimData.claimAmount);
  expect(dbClaim.status).toBe('RECEIVED');

});