const { test, expect } = require('@playwright/test');
const { AITestDataGenerator } = require('../../framework/ai/testDataGenerator');

test('@ai Generate healthcare claim test scenarios', async () => {
  test.setTimeout(180000);

  const generator = new AITestDataGenerator();

  const scenarios = await generator.generateScenarios();

  expect(Array.isArray(scenarios)).toBe(true);
  expect(scenarios).toHaveLength(5);

  const allowedStatuses = [201, 400];

  for (const scenario of scenarios) {
    expect(typeof scenario.name).toBe('string');
    expect(scenario.name.length).toBeGreaterThan(0);
    expect(typeof scenario.claimAmount).toBe('number');
    expect(typeof scenario.serviceDate).toBe('string');
    expect(allowedStatuses).toContain(scenario.expectedStatus);
  }

  console.log('AI-generated scenarios:', JSON.stringify(scenarios, null, 2));
});
