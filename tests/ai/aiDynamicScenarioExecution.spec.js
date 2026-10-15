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

const {
  AIExecutionReporter
} = require('../../framework/reporters/aiExecutionReporter');

test('@ai Dynamically execute approved AI scenarios', async ({ request }) => {
  test.setTimeout(150000);

  // Initialize framework components
  const analyzer = new AICoverageAnalyzer();
  const validator = new AICoverageValidator();
  const duplicateDetector = new AIDuplicateCoverageDetector();
  const reporter = new AIExecutionReporter();

  // STEP 1: Generate AI scenarios using Ollama
  console.log('\n===== GENERATING AI TEST SCENARIOS =====');

  const report = await analyzer.analyzeCoverage();

  const results = [];

  // STEP 2: Process AI-generated scenarios
  for (const scenario of report.recommendations) {
    const validation = validator.validate(scenario);

    // STEP 3: Reject invalid or unsupported scenarios
    if (!validation.valid) {
      results.push({
        scenario: scenario.scenario,
        status: 'REJECTED',
        reason: validation.errors.join('; ')
      });

      continue;
    }

    // STEP 4: Detect duplicate test coverage
    const duplicateCheck = duplicateDetector.check(scenario);

    if (duplicateCheck.duplicate) {
      results.push({
        scenario: scenario.scenario,
        status: 'DUPLICATE',
        reason: duplicateCheck.reason
      });

      continue;
    }

    // STEP 5: Execute approved AI scenario against healthcare API
    try {
      const response = await request.fetch(
        `http://localhost:3000${scenario.endpoint}`,
        {
          method: scenario.method,
          ...(scenario.method === 'POST'
            ? { data: scenario.requestBody }
            : {})
        }
      );

      const actualStatus = response.status();
      const expectedStatus = scenario.expectedStatus;

      const responseBody = await response.text();

      // STEP 6: Compare actual and expected results
      const status =
        actualStatus === expectedStatus
          ? 'PASSED'
          : 'FAILED';

      results.push({
        scenario: scenario.scenario,
        ruleId: scenario.ruleId,
        method: scenario.method,
        endpoint: scenario.endpoint,
        status,
        expectedStatus,
        actualStatus,
        responseBody
      });
    } catch (error) {
      // Capture execution errors without losing the report
      results.push({
        scenario: scenario.scenario,
        ruleId: scenario.ruleId,
        status: 'FAILED',
        expectedStatus: scenario.expectedStatus,
        actualStatus: null,
        reason: error.message
      });
    }
  }

  // STEP 7: Display execution results
  console.log('\n===== DYNAMIC AI EXECUTION RESULTS =====');
  console.table(results);

  // STEP 8: Calculate execution summary
  const executed = results.filter(
    (result) =>
      result.status === 'PASSED' ||
      result.status === 'FAILED'
  );

  const failed = executed.filter(
    (result) => result.status === 'FAILED'
  );

  console.log('\n===== EXECUTION SUMMARY =====');

  console.log({
    generated: results.length,
    executed: executed.length,
    passed: executed.length - failed.length,
    failed: failed.length,
    skipped: results.length - executed.length
  });

  // STEP 9: Save real AI execution results to JSON
  const {
    filepath,
    report: executionReport
  } = reporter.save(results);

  console.log('\n===== SAVED AI EXECUTION REPORT =====');

  console.log('Report file:', filepath);
  console.log('Report summary:', executionReport.summary);

  // STEP 10: Verify all recommendations were processed
  expect(results).toHaveLength(3);

  // STEP 11: Fail if an executed API scenario failed
  expect(failed).toHaveLength(0);
});