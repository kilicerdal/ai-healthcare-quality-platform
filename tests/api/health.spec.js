const { test, expect } = require('@playwright/test');

test('@smoke @sanity @api Claims API health check', async ({ request }) => {

  const response = await request.get('http://localhost:3000/health');

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.status).toBe('UP');
  expect(body.service).toBe('healthcare-claims-api');
});