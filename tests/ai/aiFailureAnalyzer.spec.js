const { test, expect } = require('@playwright/test');
const { AIFailureAnalyzer } = require('../../framework/ai/failureAnalyzer');

test('@ai @regression Analyze Playwright API failure using local AI', async () => {
  test.setTimeout(150000);

  const analyzer = new AIFailureAnalyzer();

  // Simulated failure for testing the analyzer.
  // This does not indicate a failure in the actual API.
  const testName = 'Create healthcare claim';

  const errorMessage = `
Expected HTTP status: 201
Received HTTP status: 400

Endpoint: POST /api/claims

Request:
{
  "providerId": "PRV-2001",
  "serviceDate": "2026-10-09",
  "diagnosisCode": "Z00.00",
  "claimAmount": 425.50
}

Response:
{
  "error": "Missing required claim fields"
}
`;

  const analysis = await analyzer.analyzeFailure(testName, errorMessage);

  console.log('\n===== AI FAILURE ANALYSIS =====\n');
  console.log(analysis);

  expect(analysis).toBeTruthy();
  expect(analysis.length).toBeGreaterThan(100);
});
