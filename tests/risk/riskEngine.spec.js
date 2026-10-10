const { test, expect } = require('@playwright/test');
const { RiskBasedTestSelector } = require('../../framework/risk/testSelector');

test('@risk Select regression tests for claims API changes', async () => {
  const selector = new RiskBasedTestSelector();

  const result = selector.selectTests(['app/server.js']);

  expect(result.recommendedTags).toContain('@api');
  expect(result.recommendedTags).toContain('@database');
  expect(result.recommendedTags).toContain('@e2e');

  console.log('Claims API risk analysis:', result);
});

test('@risk Select regression tests for SQS changes', async () => {
  const selector = new RiskBasedTestSelector();

  const result = selector.selectTests(['app/sqsClaimsProcessor.js']);

  expect(result.recommendedTags).toContain('@sqs');
  expect(result.recommendedTags).toContain('@e2e');

  console.log('SQS risk analysis:', result);
});

test('@risk Select AI tests for AI framework changes', async () => {
  const selector = new RiskBasedTestSelector();

  const result = selector.selectTests(['framework/ai/ollamaClient.js']);

  expect(result.recommendedTags).toContain('@ai');

  console.log('AI risk analysis:', result);
});
