const { test, expect } = require('@playwright/test');

const {
  AIExecutionDashboard
} = require('../../framework/reporters/aiExecutionDashboard');

test('@ai Display latest AI execution dashboard', async () => {
  const dashboard = new AIExecutionDashboard();

  const { filename, report } = dashboard.getLatestReport();

  dashboard.display();

  expect(filename).toMatch(/^ai-execution-.*\.json$/);

  expect(report.summary.generated).toBe(report.results.length);

  expect(
    report.summary.passed +
      report.summary.failed +
      report.summary.rejected +
      report.summary.duplicates
  ).toBe(report.summary.generated);
});
