const { test, expect } = require('@playwright/test');
const { ClaimsClient } = require('../../framework/clients/claimsClient');
const { ClaimBuilder } = require('../../framework/builders/claimBuilder');

test('@sanity @regression @api Create a healthcare claim', async ({ request }) => {

  const claimsClient = new ClaimsClient(request);

  const claimData = new ClaimBuilder().build();

  const response = await claimsClient.createClaim(claimData);

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.claimId).toBeTruthy();
  expect(body.memberId).toBe(claimData.memberId);
  expect(body.providerId).toBe(claimData.providerId);
  expect(body.serviceDate).toBe(claimData.serviceDate);
  expect(body.diagnosisCode).toBe(claimData.diagnosisCode);
  expect(body.claimAmount).toBe(claimData.claimAmount);
  expect(body.status).toBe('RECEIVED');
  expect(body.createdAt).toBeTruthy();
});

test('@regression @api Reject claim with missing memberId', async ({ request }) => {

  const claimsClient = new ClaimsClient(request);

  const claimData = new ClaimBuilder().build();

  delete claimData.memberId;

  const response = await claimsClient.createClaim(claimData);

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error).toBe('Missing required claim fields');
});

test('@sanity @regression @api Create and retrieve a healthcare claim', async ({ request }) => {

  const claimsClient = new ClaimsClient(request);

  const claimData = new ClaimBuilder()
    .withMemberId('MEM-3001')
    .withProviderId('PRV-4001')
    .withDiagnosisCode('E11.9')
    .withClaimAmount(750)
    .build();

  // Step 1: Create the claim
  const createResponse = await claimsClient.createClaim(claimData);

  expect(createResponse.status()).toBe(201);

  const createdClaim = await createResponse.json();

  expect(createdClaim.claimId).toBeTruthy();

  // Step 2: Retrieve the same claim
  const getResponse = await claimsClient.getClaim(createdClaim.claimId);

  expect(getResponse.status()).toBe(200);

  const retrievedClaim = await getResponse.json();

  // Step 3: Validate the retrieved data
  expect(retrievedClaim.claimId).toBe(createdClaim.claimId);
  expect(retrievedClaim.memberId).toBe(claimData.memberId);
  expect(retrievedClaim.providerId).toBe(claimData.providerId);
  expect(retrievedClaim.serviceDate).toBe(claimData.serviceDate);
  expect(retrievedClaim.diagnosisCode).toBe(claimData.diagnosisCode);
  expect(retrievedClaim.claimAmount).toBe(claimData.claimAmount);
  expect(retrievedClaim.status).toBe('RECEIVED');
});

test('@regression @api Return 404 for nonexistent claim', async ({ request }) => {

  const claimsClient = new ClaimsClient(request);

  const response = await claimsClient.getClaim(
    'CLM-00000000-0000-0000-0000-000000000000'
  );

  expect(response.status()).toBe(404);

  const body = await response.json();

  expect(body.error).toBe('Claim not found');
});