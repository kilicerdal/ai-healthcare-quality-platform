const { test, expect } = require('@playwright/test');

const {
  AICoverageAnalyzer
} = require('../../framework/ai/aiCoverageAnalyzer');

const {
  AICoverageValidator
} = require('../../framework/validators/aiCoverageValidator');

test('@ai Analyze and validate healthcare API coverage', async () => {
  test.setTimeout(150000);

  const analyzer = new AICoverageAnalyzer();
  const validator = new AICoverageValidator();

  // Step 1: Generate coverage recommendations using Ollama
  const report = await analyzer.analyzeCoverage();

  console.log('\n===== OLLAMA COVERAGE ANALYSIS =====');
  console.log(report.analysis);

  // Step 2: Define structured candidates for validation
  // These examples represent recommendations to review.
  const recommendations = [
    {
      ruleId: 'missing-required-field',
      endpoint: '/api/claims',
      method: 'POST',
      expectedStatus: 400
    },
    {
      ruleId: 'duplicate-claim',
      endpoint: '/api/claims',
      method: 'POST',
      expectedStatus: 409
    },
    {
      ruleId: 'claim-not-found',
      endpoint: '/api/claims/:claimId',
      method: 'GET',
      expectedStatus: 404
    }
  ];

  // Step 3: Validate each structured candidate
  const results = recommendations.map(scenario => ({
    ...scenario,
    ...validator.validate(scenario)
  }));

  console.log('\n===== COVERAGE VALIDATION RESULTS =====');
  console.table(results);

  // Step 4: Verify the validator's decisions
  expect(results[0].valid).toBe(true);
  expect(results[1].valid).toBe(false);
  expect(results[2].valid).toBe(true);
});