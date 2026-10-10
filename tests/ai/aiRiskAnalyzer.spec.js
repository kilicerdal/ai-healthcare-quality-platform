const { test, expect } = require('@playwright/test');
const { AIRiskAnalyzer } = require('../../framework/ai/riskAnalyzer');

test('@ai @risk Analyze healthcare regression risk using local AI', async () => {
  test.setTimeout(150000);

  const analyzer = new AIRiskAnalyzer();

  const result = await analyzer.analyze([
    'app/server.js',
    'app/sqsClaimsProcessor.js'
  ]);

  console.log('\n===== AI RISK ANALYSIS =====\n');
  console.log(result.aiExplanation);

  expect(result.recommendedTags).toContain('@api');
  expect(result.recommendedTags).toContain('@database');
  expect(result.recommendedTags).toContain('@sqs');
  expect(result.recommendedTags).toContain('@e2e');

  expect(result.aiExplanation).toBeTruthy();
  expect(result.aiExplanation.length).toBeGreaterThan(100);
});
