const { test, expect } = require('@playwright/test');

const {
  AICoverageValidator
} = require('../../framework/validators/aiCoverageValidator');

test('@ai Reject scenarios with conflicting validation failures', async () => {
  const validator = new AICoverageValidator();

  const scenario = {
    ruleId: 'invalid-service-date',
    endpoint: '/api/claims',
    method: 'POST',
    expectedStatus: 400,
    requestBody: {
      memberId: 'MEM001',
      providerId: 'PROV001',
      serviceDate: '2026-15-45',
      diagnosisCode: '',
      claimAmount: -100
    }
  };

  const result = validator.validate(scenario);

  console.log('\n===== CONFLICTING VALIDATION RESULT =====');
  console.log(result);

  expect(result.valid).toBe(false);

  expect(
    result.errors.some((error) =>
      error.includes('Conflicting validation failures')
    )
  ).toBe(true);
});
