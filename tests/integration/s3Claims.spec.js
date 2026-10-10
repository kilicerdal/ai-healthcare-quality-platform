const { test, expect } = require('@playwright/test');
const { randomUUID } = require('crypto');

const { S3StorageClient } = require('../../framework/clients/s3Client');
const { ClaimBuilder } = require('../../framework/builders/claimBuilder');

test('@regression @integration @s3 Upload and retrieve healthcare claim from local S3', async () => {

  const s3Client = new S3StorageClient();

  // Step 1: Generate synthetic healthcare claim data
  const claimData = new ClaimBuilder()
    .withMemberId('MEM-7001')
    .withProviderId('PRV-8001')
    .withDiagnosisCode('E11.9')
    .withClaimAmount(950.75)
    .build();

  // Step 2: Generate a unique filename
  const fileName = `claims/${randomUUID()}.json`;

  // Step 3: Upload the claim to local S3
  const uploadResponse = await s3Client.uploadClaim(fileName, claimData);

  expect(uploadResponse.$metadata.httpStatusCode).toBe(200);

  // Step 4: Retrieve the uploaded claim
  const retrievedClaim = await s3Client.getClaim(fileName);

  // Step 5: Validate data integrity
  expect(retrievedClaim).toEqual(claimData);

  // Step 6: Verify the file exists in the bucket
  const files = await s3Client.listClaims();

  expect(files.some(file => file.Key === fileName)).toBe(true);

});