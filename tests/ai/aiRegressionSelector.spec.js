const { test, expect } = require('@playwright/test');

const {
  AIRegressionSelector
} = require('../../framework/ai/aiRegressionSelector');

test('@ai Select regression tests based on code changes', async () => {
  test.setTimeout(120000);

  const selector = new AIRegressionSelector();

  const result = await selector.selectTests();

  console.log('\n===== AI REGRESSION SELECTION =====');

  console.log('Changed files:', result.changedFiles);
  console.log('Required tests:', result.requiredTests);
  console.log('AI recommendations:', result.aiRecommendedTests);
  console.log('Final selected tests:', result.selectedTests);
  console.log('AI explanation:', result.reason);

  const availableTests = selector.getAvailableTests();

  expect(result.changedFiles.length).toBeGreaterThan(0);

  for (const requiredTest of result.requiredTests) {
    expect(result.selectedTests).toContain(requiredTest);
  }

  for (const selectedTest of result.selectedTests) {
    expect(availableTests).toContain(selectedTest);
  }
});