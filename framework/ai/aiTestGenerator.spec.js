const { test, expect } = require('@playwright/test');
const { AITestGenerator } = require('../../framework/ai/testGenerator');

test.describe.configure({ timeout: 150000 });

test('@ai @regression Generate healthcare API test scenarios using local AI', async () => {
  const generator = new AITestGenerator();

  const requirements = `
Healthcare Claims API:

Endpoint: POST /api/claims

Required fields:
- memberId
- providerId
- serviceDate
- diagnosisCode
- claimAmount

Successful requests return HTTP 201.

Missing required fields return HTTP 400.

The API stores successfully created claims in PostgreSQL.
`;

  const scenarios = await generator.generateTestScenarios(requirements);

  console.log('\n===== AI GENERATED TEST SCENARIOS =====\n');
  console.log(scenarios);

  expect(scenarios).toBeTruthy();
  expect(scenarios.length).toBeGreaterThan(100);
});
