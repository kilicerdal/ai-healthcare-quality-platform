const { test, expect } = require('@playwright/test');

const { ClaimsClient } = require('../../framework/clients/claimsClient');
const { ClaimBuilder } = require('../../framework/builders/claimBuilder');
const { DatabaseClient } = require('../../framework/clients/databaseClient');

test('@regression @database @integration Verify claim is saved correctly in PostgreSQL', async ({ request }) => {

  const claimsClient = new ClaimsClient(request);
  const databaseClient = new DatabaseClient();

  // Step 1: Generate claim test data
  const claimData = new ClaimBuilder()
    .withMemberId('MEM-5001')
    .withProviderId('PRV-6001')
    .withDiagnosisCode('E11.9')
    .withClaimAmount(1250.75)
    .build();

  // Step 2: Create claim through API
  const response = await claimsClient.createClaim(claimData);

  expect(response.status()).toBe(201);

  const createdClaim = await response.json();

  expect(createdClaim.claimId).toBeTruthy();

  // Step 3: Query PostgreSQL directly
  const dbClaim = await databaseClient.getClaimById(createdClaim.claimId);

  expect(dbClaim).not.toBeNull();

  // Step 4: Validate API data against database data
  expect(dbClaim.claim_id).toBe(createdClaim.claimId);
  expect(dbClaim.member_id).toBe(claimData.memberId);
  expect(dbClaim.provider_id).toBe(claimData.providerId);
  expect(dbClaim.diagnosis_code).toBe(claimData.diagnosisCode);
  expect(Number(dbClaim.claim_amount)).toBe(claimData.claimAmount);
  expect(dbClaim.status).toBe('RECEIVED');

  // Validate service date
const dbServiceDate = new Date(dbClaim.service_date)
  .toISOString()
  .split('T')[0];

expect(dbServiceDate).toBe(claimData.serviceDate);

// Validate creation timestamp
expect(dbClaim.created_at).toBeInstanceOf(Date);

expect(dbClaim.created_at.getTime()).not.toBeNaN();

// Compare API and database timestamps
const apiCreatedAt = new Date(createdClaim.createdAt);

expect(dbClaim.created_at.getTime()).toBe(apiCreatedAt.getTime());

});
test('@regression @database Verify nonexistent claim is not found in PostgreSQL', async () => {

  const databaseClient = new DatabaseClient();

  // Generate an ID that does not exist
  const nonexistentClaimId = 'CLM-00000000-0000-0000-0000-000000000000';

  // Query PostgreSQL directly
  const dbClaim = await databaseClient.getClaimById(nonexistentClaimId);

  // Verify no record exists
  expect(dbClaim).toBeNull();

});