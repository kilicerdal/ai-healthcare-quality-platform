const { test, expect } = require('@playwright/test');
const { ClaimsClient } = require('../../framework/clients/claimsClient');
const { ClaimBuilder } = require('../../framework/builders/claimBuilder');
const { SchemaValidator } = require('../../framework/validators/schemaValidator');
const claimSchema = require('../../framework/schemas/claimResponse.schema.json');

test('@contract @regression Validate create claim response schema', async ({ request }) => {
  const client = new ClaimsClient(request);
  const validator = new SchemaValidator();
  const claim = new ClaimBuilder().build();

  const response = await client.createClaim(claim);

  expect(response.status()).toBe(201);

  const body = await response.json();
  const result = validator.validate(claimSchema, body);

  expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
});

test('@contract @regression Validate retrieve claim response schema', async ({ request }) => {
  const client = new ClaimsClient(request);
  const validator = new SchemaValidator();
  const claim = new ClaimBuilder().build();

  const createResponse = await client.createClaim(claim);
  expect(createResponse.status()).toBe(201);

  const created = await createResponse.json();

  const getResponse = await client.getClaim(created.claimId);
  expect(getResponse.status()).toBe(200);

  const body = await getResponse.json();
  const result = validator.validate(claimSchema, body);

  expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
});
