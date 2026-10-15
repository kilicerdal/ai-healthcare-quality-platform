const { test, expect } = require('@playwright/test');

const {
  AICoverageValidator
} = require('../../framework/validators/aiCoverageValidator');

test('@ai Validate approved and unsupported coverage rules', async () => {
  const validator = new AICoverageValidator();

  // Valid scenario: diagnosisCode is missing
  const approvedScenario = {
    ruleId: 'missing-required-field',
    endpoint: '/api/claims',
    method: 'POST',
    expectedStatus: 400,
    requestBody: {
      memberId: 'MEM001',
      providerId: 'PROV001',
      serviceDate: '2026-10-15',
      claimAmount: 100
    }
  };

  // Unsupported scenario: duplicate claim rule does not exist
  const unsupportedScenario = {
    ruleId: 'duplicate-claim',
    endpoint: '/api/claims',
    method: 'POST',
    expectedStatus: 409,
    requestBody: {
      memberId: 'MEM001',
      providerId: 'PROV001',
      serviceDate: '2026-10-15',
      diagnosisCode: 'Z00.00',
      claimAmount: 100
    }
  };

  const validResult = validator.validate(approvedScenario);
  const invalidResult = validator.validate(unsupportedScenario);

  console.log('Approved scenario:', validResult);
  console.log('Unsupported scenario:', invalidResult);

  expect(validResult.valid).toBe(true);
  expect(invalidResult.valid).toBe(false);
  expect(invalidResult.errors[0]).toContain('Unsupported rule');
});