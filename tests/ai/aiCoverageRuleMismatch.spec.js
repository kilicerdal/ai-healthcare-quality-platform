const { test, expect } = require('@playwright/test');

const {
  AICoverageValidator
} = require('../../framework/validators/aiCoverageValidator');

test('@ai Reject AI scenarios with mismatched validation rules', async () => {
  const validator = new AICoverageValidator();

  const scenario = {
    ruleId: 'invalid-service-date',
    scenario: 'Reject invalid service date',
    method: 'POST',
    endpoint: '/api/claims',
    expectedStatus: 400,
    requestBody: {
      memberId: 'MEM001',
      providerId: 'PROV001',
      serviceDate: '2026-10-15',
      diagnosisCode: 'Z00.00',
      claimAmount: -100
    }
  };

  const result = validator.validate(scenario);

  console.log('\n===== RULE MISMATCH VALIDATION =====');
  console.log(result);

  expect(result.valid).toBe(false);

  expect(result.errors).toContain(
    'Rule mismatch: expected invalid-service-date, but requestBody violates invalid-claim-amount'
  );
});