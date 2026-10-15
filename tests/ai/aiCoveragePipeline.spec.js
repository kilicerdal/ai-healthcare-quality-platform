const { test, expect } = require('@playwright/test');

const {
  AICoverageAnalyzer
} = require('../../framework/ai/aiCoverageAnalyzer');

const {
  AICoverageValidator
} = require('../../framework/validators/aiCoverageValidator');

const {
  AIDuplicateCoverageDetector
} = require('../../framework/ai/aiDuplicateCoverageDetector');

test('@ai Run complete healthcare AI coverage pipeline', async () => {
  test.setTimeout(150000);

  const analyzer = new AICoverageAnalyzer();
  const validator = new AICoverageValidator();
  const duplicateDetector = new AIDuplicateCoverageDetector();

  // Step 1: Generate scenarios with Ollama
  const report = await analyzer.analyzeCoverage();

  // Step 2: Validate and check duplicates
  const results = report.recommendations.map((scenario) => {
    const validation = validator.validate(scenario);

    if (!validation.valid) {
      return {
        scenario: scenario.scenario,
        status: 'REJECTED',
        reason: validation.errors.join('; ')
      };
    }

    const duplicateCheck = duplicateDetector.check(scenario);

    if (duplicateCheck.duplicate) {
      return {
        scenario: scenario.scenario,
        status: 'DUPLICATE',
        reason: duplicateCheck.reason
      };
    }

    return {
      scenario: scenario.scenario,
      status: 'APPROVED',
      reason: 'Valid scenario with no matching existing coverage'
    };
  });

  console.log('\n===== AI COVERAGE PIPELINE RESULTS =====');
  console.table(results);

  const summary = {
    total: results.length,
    approved: results.filter((r) => r.status === 'APPROVED').length,
    rejected: results.filter((r) => r.status === 'REJECTED').length,
    duplicates: results.filter((r) => r.status === 'DUPLICATE').length
  };

  console.log('\n===== PIPELINE SUMMARY =====');
  console.log(summary);

  expect(results).toHaveLength(3);

  expect(
    summary.approved + summary.rejected + summary.duplicates
  ).toBe(summary.total);
});