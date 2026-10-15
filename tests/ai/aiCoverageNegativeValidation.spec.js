const { test, expect } = require('@playwright/test');

const {
  AICoverageValidator
} = require('../../framework/validators/aiCoverageValidator');

test('@ai Reject incorrect AI-generated test scenarios', async () => {
  const validator = new AICoverageValidator();

  // AI claims a required field is missing,
  // but all required fields are present.
  const incorrectScenario = {
    ruleId: 'missing-required-field',
    endpoint: '/api/claims',
    method: 'POST',
    expectedStatus: 400,
    requestBody: {
      memberId: 'MEM001',
      providerId: 'PROV001',
      serviceDate: '2026-10-15',
      diagnosisCode: 'Z00.00',
      claimAmount: 100
    }
  };

  const result = validator.validate(incorrectScenario);

  console.log('\n===== NEGATIVE VALIDATION RESULT =====');
  console.log(result);

  expect(result.valid).toBe(false);

  expect(result.errors).toContain(
    'Scenario does not contain a missing required field'
  );
});
