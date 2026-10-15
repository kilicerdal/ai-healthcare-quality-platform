const fs = require('fs');
const path = require('path');

class AIExecutionDashboard {
  constructor() {
    this.reportDirectory = path.join(
      process.cwd(),
      'reports',
      'ai-execution'
    );
  }

  getLatestReport() {
    if (!fs.existsSync(this.reportDirectory)) {
      throw new Error('AI execution report directory not found');
    }

    const files = fs
      .readdirSync(this.reportDirectory)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      throw new Error('No AI execution reports found');
    }

    const latestFile = path.join(this.reportDirectory, files[0]);

    const report = JSON.parse(fs.readFileSync(latestFile, 'utf8'));

    return {
      filename: files[0],
      report
    };
  }

  getExecutionHistory() {
  if (!fs.existsSync(this.reportDirectory)) {
    return [];
  }

  const files = fs
    .readdirSync(this.reportDirectory)
    .filter((file) => /^ai-execution-.*\.json$/.test(file))
    .sort();

  return files.map((file) => {
    const filepath = path.join(this.reportDirectory, file);

    const report = JSON.parse(
      fs.readFileSync(filepath, 'utf8')
    );

    return {
      date: report.generatedAt,
      generated: report.summary.generated,
      executed: report.summary.executed,
      passed: report.summary.passed,
      failed: report.summary.failed,
      rejected: report.summary.rejected,
      duplicates: report.summary.duplicates
    };
  });
}
  display() {
    const { filename, report } = this.getLatestReport();

    console.log('\n========================================');
    console.log('       AI EXECUTION DASHBOARD');
    console.log('========================================');

    console.log('\nLatest Report:', filename);
    console.log('Generated At:', report.generatedAt);

    console.log('\n===== EXECUTION SUMMARY =====');
    console.table(report.summary);
    // Calculate AI execution metrics
const summary = report.summary;

const successRate =
  summary.executed > 0
    ? (summary.passed / summary.executed) * 100
    : 0;

const executionRate =
  summary.generated > 0
    ? (summary.executed / summary.generated) * 100
    : 0;

const rejectionRate =
  summary.generated > 0
    ? (summary.rejected / summary.generated) * 100
    : 0;

console.log('\n===== AI EXECUTION METRICS =====');

console.table({
  'Execution Success Rate': `${successRate.toFixed(2)}%`,
  'Execution Rate': `${executionRate.toFixed(2)}%`,
  'Rejection Rate': `${rejectionRate.toFixed(2)}%`
});

    console.log('\n===== SCENARIO RESULTS =====');

    console.table(
      report.results.map((result) => ({
        scenario: result.scenario,
        status: result.status,
        expectedStatus: result.expectedStatus ?? '-',
        actualStatus: result.actualStatus ?? '-',
        reason: result.reason ?? '-'
      }))
    );

    console.log('\n===== EXECUTION HISTORY =====');
    const history = this.getExecutionHistory();
    console.table(history);

    console.log('\n========================================');
  }
}

module.exports = { AIExecutionDashboard };
