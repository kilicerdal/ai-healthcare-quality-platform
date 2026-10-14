const { test, expect } = require('@playwright/test');

const { AITestGenerator } = require('../../framework/ai/testGenerator');
const { AITestExecutor } = require('../../framework/ai/aiTestExecutor');

test('@ai @regression Execute AI-generated healthcare API scenarios', async ({
  request
}) => {
  const generator = new AITestGenerator();
  const executor = new AITestExecutor(request);

  const requirements = `
    Healthcare claims API:
    POST /api/claims

    Valid claims return HTTP 201.
    Missing memberId returns HTTP 400.
    Negative claimAmount returns HTTP 400.
    Invalid serviceDate returns HTTP 400.
    Zero claimAmount returns HTTP 400.
  `;

  // Generate and validate scenarios using Ollama.
  const scenarios = await generator.generateTestScenarios(requirements);

  expect(scenarios).toHaveLength(5);

  // Execute generated scenarios against the real API.
  const results = await executor.executeScenarios(scenarios);

  console.log('\n===== AI API EXECUTION RESULTS =====');
  console.table(results);

  // Verify every scenario passed.
  for (const result of results) {
    expect(
      result.actualStatus,
      `${result.id}: ${result.description}`
    ).toBe(result.expectedStatus);
  }
});