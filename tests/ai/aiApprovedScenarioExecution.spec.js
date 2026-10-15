const { test, expect } = require('@playwright/test');

const {
  AICoverageValidator
} = require('../../framework/validators/aiCoverageValidator');

const {
  AIDuplicateCoverageDetector
} = require('../../framework/ai/aiDuplicateCoverageDetector');

test('@ai Execute approved healthcare API scenario', async ({ request }) => {
  const validator = new AICoverageValidator();
  const duplicateDetector = new AIDuplicateCoverageDetector();

  const scenario = {
    ruleId: 'missing-required-field',
    scenario: 'Reject missing diagnosisCode',
    method: 'POST',
    endpoint: '/api/claims',
    expectedStatus: 400,
    requestBody: {
      memberId: 'MEM001',
      providerId: 'PROV001',
      serviceDate: '2026-10-15',
      claimAmount: 100
    }
  };

  // Validate the scenario before execution
  const validation = validator.validate(scenario);

  expect(validation.valid, validation.errors.join('; ')).toBe(true);

  // Verify that it is not already covered
  const duplicateCheck = duplicateDetector.check(scenario);

  expect(duplicateCheck.duplicate).toBe(false);

  // Execute the actual API request
  const response = await request.post(
    'http://localhost:3000/api/claims',
    {
      data: scenario.requestBody
    }
  );

  console.log('\n===== AI SCENARIO EXECUTION =====');
  console.log('Scenario:', scenario.scenario);
  console.log('Expected status:', scenario.expectedStatus);
  console.log('Actual status:', response.status());
  console.log('Response:', await response.text());

  expect(response.status()).toBe(scenario.expectedStatus);
});