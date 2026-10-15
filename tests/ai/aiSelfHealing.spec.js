const { test, expect } = require('@playwright/test');

const {
  AISelfHealing
} = require('../../framework/ai/aiSelfHealing');

test('@ai Analyze Playwright failure and suggest safe repair', async () => {
  test.setTimeout(120000);

  const selfHealing = new AISelfHealing();

  const simulatedFailure = {
    testName: 'Healthcare claim API validation',
    error:
      'Expected HTTP 400 but received HTTP 201. ' +
      'The request contained a positive claimAmount and all required fields.'
  };

  const result = await selfHealing.analyzeFailure(
    simulatedFailure
  );

  const reportPath = selfHealing.saveReport(result);

  console.log('\n===== AI SELF-HEALING REPORT =====');
  console.log('Test:', result.testName);
  console.log('Root cause:', result.rootCause);
  console.log('Suggested fix:', result.suggestedFix);
  console.log('Confidence:', result.confidence);
  console.log('Status:', result.status);
  console.log('Report:', reportPath);

  expect(result.rootCause.length).toBeGreaterThan(0);
  expect(result.suggestedFix.length).toBeGreaterThan(0);
  expect(result.status).toBe('REVIEW_REQUIRED');
  expect(result.automaticallyApplied).toBe(false);
});
