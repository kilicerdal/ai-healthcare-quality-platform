const { test, expect } = require('@playwright/test');

const {
  AIExecutionReporter
} = require('../../framework/reporters/aiExecutionReporter');

test('@ai Generate JSON execution report', async () => {
  const reporter = new AIExecutionReporter();

  const results = [
    {
      scenario: 'Reject missing diagnosisCode',
      status: 'PASSED',
      expectedStatus: 400,
      actualStatus: 400
    },
    {
      scenario: 'Reject invalid future date',
      status: 'REJECTED',
      reason: 'serviceDate is valid'
    },
    {
      scenario: 'Reject zero claim amount',
      status: 'DUPLICATE',
      reason: 'Existing test already covers zero-amount'
    }
  ];

  const { filepath, report } = reporter.save(results);

  console.log('\n===== JSON EXECUTION REPORT =====');
  console.log('Saved to:', filepath);
  console.log('Summary:', report.summary);

  expect(report.summary.generated).toBe(3);
  expect(report.summary.executed).toBe(1);
  expect(report.summary.passed).toBe(1);
  expect(report.summary.rejected).toBe(1);
  expect(report.summary.duplicates).toBe(1);
});