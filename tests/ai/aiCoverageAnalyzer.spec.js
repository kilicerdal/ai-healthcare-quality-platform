const { test, expect } = require('@playwright/test');

const {
  AICoverageAnalyzer
} = require('../../framework/ai/aiCoverageAnalyzer');

test('@ai Analyze healthcare API test coverage', async () => {
  const analyzer = new AICoverageAnalyzer();

  const report = await analyzer.analyzeCoverage();

  console.log('\n===== AI TEST COVERAGE ANALYSIS =====');
  console.log(report.analysis);

  expect(report.existingScenarios.length).toBe(5);
  expect(report.analysis.length).toBeGreaterThan(50);
});