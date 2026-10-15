const { test, expect } = require('@playwright/test');

const {
  AIExecutionDashboard
} = require('../../framework/reporters/aiExecutionDashboard');

test('@ai Validate AI execution dashboard metrics', async () => {
  const dashboard = new AIExecutionDashboard();

  // Load latest JSON execution report
  const { report } = dashboard.getLatestReport();

  const summary = report.summary;

  // Calculate execution metrics
  const successRate =
    summary.executed > 0
      ? (summary.passed / summary.executed) * 100
      : null;

  const executionRate =
    summary.generated > 0
      ? (summary.executed / summary.generated) * 100
      : 0;

  const rejectionRate =
    summary.generated > 0
      ? (summary.rejected / summary.generated) * 100
      : 0;

  console.log('\n===== AI EXECUTION METRIC VALIDATION =====');

  console.table({
    generated: summary.generated,
    executed: summary.executed,
    passed: summary.passed,
    failed: summary.failed,
    successRate:
      successRate === null ? 'N/A' : `${successRate.toFixed(2)}%`,
    executionRate: `${executionRate.toFixed(2)}%`,
    rejectionRate: `${rejectionRate.toFixed(2)}%`
  });

  // Verify execution totals
  expect(summary.executed).toBe(
    summary.passed + summary.failed
  );

  // Verify generated scenario totals
  expect(summary.generated).toBe(
    summary.passed +
      summary.failed +
      summary.rejected +
      summary.duplicates
  );

  // Verify valid percentage ranges
  if (successRate !== null) {
    expect(successRate).toBeGreaterThanOrEqual(0);
    expect(successRate).toBeLessThanOrEqual(100);
  }

  expect(executionRate).toBeGreaterThanOrEqual(0);
  expect(executionRate).toBeLessThanOrEqual(100);

  expect(rejectionRate).toBeGreaterThanOrEqual(0);
  expect(rejectionRate).toBeLessThanOrEqual(100);

  // Verify that report results match the summary
  expect(summary.generated).toBe(report.results.length);

  expect(summary.passed).toBe(
    report.results.filter((r) => r.status === 'PASSED').length
  );

  expect(summary.failed).toBe(
    report.results.filter((r) => r.status === 'FAILED').length
  );

  expect(summary.rejected).toBe(
    report.results.filter((r) => r.status === 'REJECTED').length
  );

  expect(summary.duplicates).toBe(
    report.results.filter((r) => r.status === 'DUPLICATE').length
  );
});
