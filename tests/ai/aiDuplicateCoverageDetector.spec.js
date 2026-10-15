const { test, expect } = require('@playwright/test');

const {
  AIDuplicateCoverageDetector
} = require('../../framework/ai/aiDuplicateCoverageDetector');

test('@ai Detect duplicate healthcare API coverage', async () => {
  const detector = new AIDuplicateCoverageDetector();

  const duplicateScenario = {
    ruleId: 'invalid-claim-amount',
    requestBody: {
      claimAmount: 0
    }
  };

  const newScenario = {
    ruleId: 'missing-required-field',
    requestBody: {
      memberId: 'MEM001',
      providerId: 'PROV001',
      serviceDate: '2026-10-15',
      claimAmount: 100
    }
  };

  const duplicateResult = detector.check(duplicateScenario);
  const newResult = detector.check(newScenario);

  console.log('\n===== DUPLICATE COVERAGE RESULTS =====');
  console.log('Existing scenario:', duplicateResult);
  console.log('New scenario:', newResult);

  expect(duplicateResult.duplicate).toBe(true);
  expect(newResult.duplicate).toBe(false);
});