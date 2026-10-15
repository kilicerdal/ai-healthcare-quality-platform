const { test, expect } = require('@playwright/test');
const { AIFailureReporter } = require('../../framework/ai/aiFailureReporter');

test('@ai Generate AI failure report', async () => {
  const reporter = new AIFailureReporter();

  const results = [
    {
      id: 'TC001',
      description: 'Create a valid healthcare claim',
      expectedStatus: 201,
      actualStatus: 201,
      passed: true
    },
    {
      id: 'TC003',
      description: 'Create a claim with negative claimAmount',
      expectedStatus: 400,
      actualStatus: 201,
      passed: false,
      aiAnalysis: 'Possible missing validation for negative claimAmount.'
    }
  ];

  const report = reporter.save(results);

  expect(report.totalExecuted).toBe(2);
  expect(report.totalFailed).toBe(1);
  expect(report.failures[0].testId).toBe('TC003');

  console.log('\n===== AI FAILURE REPORT =====');
  console.log(JSON.stringify(report, null, 2));
});
