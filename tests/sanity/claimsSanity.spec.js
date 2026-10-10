const { test, expect } = require('@playwright/test');

test('@sanity @regression Create and retrieve healthcare claim', async ({ request }) => {
  const claim = {
    memberId: 'MEM-SANITY-1001',
    providerId: 'PRV-SANITY-2001',
    serviceDate: '2026-10-10',
    diagnosisCode: 'Z00.00',
    claimAmount: 250.50
  };

  const createResponse = await request.post(
    'http://localhost:3000/api/claims',
    { data: claim }
  );

  expect(createResponse.status()).toBe(201);

  const created = await createResponse.json();

  expect(created.claimId).toBeTruthy();
  expect(created.status).toBe('RECEIVED');

  const getResponse = await request.get(
    `http://localhost:3000/api/claims/${created.claimId}`
  );

  expect(getResponse.status()).toBe(200);

  const retrieved = await getResponse.json();

  expect(retrieved.claimId).toBe(created.claimId);
  expect(retrieved.memberId).toBe(claim.memberId);
  expect(Number(retrieved.claimAmount)).toBe(claim.claimAmount);
});
