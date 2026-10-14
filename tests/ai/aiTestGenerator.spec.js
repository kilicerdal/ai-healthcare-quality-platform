const { test, expect } = require('@playwright/test');
const {
  AITestGenerator
} = require('../../framework/ai/testGenerator');

test('@ai @regression Generate and validate healthcare API scenarios using Ollama', async () => {
  test.setTimeout(150000);

  const generator = new AITestGenerator();

  const requirements = `
Healthcare Claims API

POST /api/claims:
- Requires memberId, providerId, serviceDate,
  diagnosisCode, and claimAmount.
- Valid requests return HTTP 201.
- Missing required fields return HTTP 400.
- Negative or zero claim amounts return HTTP 400.
- Invalid service dates return HTTP 400.

GET /api/claims/:claimId:
- Existing claims return HTTP 200.
- Nonexistent claims return HTTP 404.
`;

  const scenarios = await generator.generateTestScenarios(
    requirements
  );

  console.log('\n===== VALIDATED AI TEST SCENARIOS =====');
  console.log(JSON.stringify(scenarios, null, 2));

  expect(scenarios).toHaveLength(5);

  for (const scenario of scenarios) {
    expect(scenario.id).toBeTruthy();
    expect(scenario.endpoint).toBeTruthy();
    expect(scenario.description).toBeTruthy();
    expect(Number.isInteger(scenario.expectedStatus)).toBe(true);
    expect(scenario.testData).toBeDefined();
  }
});