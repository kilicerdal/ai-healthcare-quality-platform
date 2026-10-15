const { test, expect } = require('@playwright/test');
const { AIFailureAnalyzer } = require('../../framework/ai/aiFailureAnalyzer');

test('@ai Analyze a failed healthcare API test', async () => {
  const analyzer = new AIFailureAnalyzer();

  // Simulated failure to test our AI analyzer.
  const failedResult = {
    id: 'TC003',
    description: 'Create a claim with negative claimAmount',
    expectedStatus: 400,
    actualStatus: 201,
    passed: false
  };

  const result = await analyzer.analyzeFailure(failedResult);

  console.log('\n===== AI FAILURE ANALYSIS =====');
  console.log(result.analysis);

  expect(result.testId).toBe('TC003');
  expect(result.analysis.length).toBeGreaterThan(20);
});