const fs = require('fs');
const path = require('path');

class AIFailureReporter {
  constructor() {
    this.reportFile = path.join(
      process.cwd(),
      'reports/dashboard/ai-failure-results.json'
    );
  }

  save(results) {
    const failures = results
      .filter(result => !result.passed)
      .map(result => ({
        testId: result.id,
        description: result.description,
        expectedStatus: result.expectedStatus,
        actualStatus: result.actualStatus,
        analysis: result.aiAnalysis || 'AI analysis unavailable'
      }));

    const report = {
      generatedAt: new Date().toISOString(),
      totalExecuted: results.length,
      totalFailed: failures.length,
      failures
    };

    fs.mkdirSync(path.dirname(this.reportFile), {
      recursive: true
    });

    fs.writeFileSync(
      this.reportFile,
      JSON.stringify(report, null, 2)
    );

    console.log(`AI failure report saved: ${this.reportFile}`);

    return report;
  }
}

module.exports = { AIFailureReporter };