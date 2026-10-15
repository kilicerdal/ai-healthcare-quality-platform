const { test, expect } = require('@playwright/test');

const {
  AIOpenAPIAnalyzer
} = require('../../framework/ai/aiOpenAPIAnalyzer');

test('@ai Generate healthcare API scenarios from OpenAPI', async () => {
  test.setTimeout(120000);

  const analyzer = new AIOpenAPIAnalyzer();

  const scenarios = await analyzer.generateScenarios();

  console.log('\n===== OPENAPI AI GENERATED SCENARIOS =====');

  console.table(scenarios);

  expect(scenarios).toHaveLength(3);

  const allowedEndpoints = [
    '/health',
    '/api/claims',
    '/api/claims/{claimId}'
  ];

  for (const scenario of scenarios) {
    expect(allowedEndpoints).toContain(scenario.endpoint);

    expect(['GET', 'POST']).toContain(scenario.method);

    expect([200, 201, 400, 404]).toContain(
      scenario.expectedStatus
    );
  }
});