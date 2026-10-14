
const { test, expect } = require('@playwright/test');
const { ClaimsClient } = require('../../framework/clients/claimsClient');
const { ClaimBuilder } = require('../../framework/builders/claimBuilder');

const requiredFields = [
  'memberId',
  'providerId',
  'serviceDate',
  'diagnosisCode',
  'claimAmount'
];

// Test 1: Reject missing required fields
test('@regression @api Reject missing required claim fields', async ({ request }) => {
  const client = new ClaimsClient(request);

  for (const field of requiredFields) {
    const claim = new ClaimBuilder().build();
    delete claim[field];

    const response = await client.createClaim(claim);

    expect(response.status(), `Missing ${field}`).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Missing required claim fields');
  }
});

// Test 2: Reject negative claim amount
test('@regression @api Reject negative claim amount', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().withClaimAmount(-100).build();

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error)
    .toBe('Claim amount must be a positive number');
});

// Test 3: Reject zero claim amount
test('@regression @api Reject zero claim amount', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().withClaimAmount(0).build();

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error)
    .toBe('Claim amount must be a positive number');
});

// Test 4: Reject nonnumeric claim amount
test('@regression @api Reject nonnumeric claim amount', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().withClaimAmount('INVALID').build();

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error)
    .toBe('Claim amount must be a positive number');
});

// Test 5: Reject invalid calendar date
test('@regression @api Reject invalid service date', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().build();

  claim.serviceDate = '2026-02-30';

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe('Invalid service date');
});

// Test 6: Accept minimum positive claim amount
test('@regression @api Accept small positive claim amount', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().withClaimAmount(0.01).build();

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.claimAmount).toBe(0.01);
  expect(body.status).toBe('RECEIVED');
});

// Test 7: Reject numeric service date
test('@regression @api Reject numeric service date', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().build();

  claim.serviceDate = 12345;

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe('Invalid service date');
});

// Test 8: Reject boolean service date
test('@regression @api Reject boolean service date', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().build();

  claim.serviceDate = true;

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe('Invalid service date');
});

// Test 9: Reject array service date
test('@regression @api Reject array service date', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().build();

  claim.serviceDate = ['2026-10-10'];

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe('Invalid service date');
});

// Test 10: Reject object service date
test('@regression @api Reject object service date', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().build();

  claim.serviceDate = { value: '2026-10-10' };

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe('Invalid service date');
});

// Test 11: Reject null claim amount
test('@regression @api Reject null claim amount', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().build();

  claim.claimAmount = null;

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error)
    .toBe('Claim amount must be a positive number');
});
