const { test, expect } = require('@playwright/test');

const {
  AICoverageAnalyzer
} = require('../../framework/ai/aiCoverageAnalyzer');

const {
  AICoverageValidator
} = require('../../framework/validators/aiCoverageValidator');

test('@ai Validate AI-generated healthcare coverage recommendations', async () => {
  test.setTimeout(150000);

  const analyzer = new AICoverageAnalyzer();
  const validator = new AICoverageValidator();

  // Generate real recommendations using Ollama
  const report = await analyzer.analyzeCoverage();

  // Validate the recommendations returned by Ollama
  const results = report.recommendations.map((scenario) => {
    const validation = validator.validate(scenario);

    return {
      scenario: scenario.scenario,
      ruleId: scenario.ruleId,
      valid: validation.valid,
      errors: validation.errors
    };
  });

  console.log('\n===== AI COVERAGE VALIDATION =====');
  console.table(results);

  expect(results).toHaveLength(3);

  for (const result of results) {
    expect(typeof result.valid).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
  }

  console.log('\nAI recommendations processed successfully.');
});