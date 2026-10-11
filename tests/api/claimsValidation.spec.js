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

test('@regression @api Reject negative claim amount', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().withClaimAmount(-100).build();

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error)
    .toBe('Claim amount must be a positive number');
});

test('@regression @api Reject zero claim amount', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().withClaimAmount(0).build();

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error)
    .toBe('Claim amount must be a positive number');
});

test('@regression @api Reject nonnumeric claim amount', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().withClaimAmount('INVALID').build();

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error)
    .toBe('Claim amount must be a positive number');
});

test('@regression @api Reject invalid service date', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().build();

  claim.serviceDate = '2026-02-30';

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe('Invalid service date');
});

test('@regression @api Accept small positive claim amount', async ({ request }) => {
  const client = new ClaimsClient(request);
  const claim = new ClaimBuilder().withClaimAmount(0.01).build();

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.claimAmount).toBe(0.01);
  expect(body.status).toBe('RECEIVED');
});
