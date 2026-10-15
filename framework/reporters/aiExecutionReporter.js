const fs = require('fs');
const path = require('path');

class AIExecutionReporter {
  constructor() {
    this.reportDirectory = path.join(
      process.cwd(),
      'reports',
      'ai-execution'
    );
  }

  save(results) {
    fs.mkdirSync(this.reportDirectory, { recursive: true });

    const timestamp = new Date().toISOString();

    const summary = {
      generated: results.length,
      executed: results.filter(
        (r) => r.status === 'PASSED' || r.status === 'FAILED'
      ).length,
      passed: results.filter((r) => r.status === 'PASSED').length,
      failed: results.filter((r) => r.status === 'FAILED').length,
      rejected: results.filter((r) => r.status === 'REJECTED').length,
      duplicates: results.filter((r) => r.status === 'DUPLICATE').length
    };

    const report = {
      generatedAt: timestamp,
      summary,
      results
    };

    const filename = `ai-execution-${timestamp.replace(/[:.]/g, '-')}.json`;

    const filepath = path.join(this.reportDirectory, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    return {
      filepath,
      report
    };
  }
}

module.exports = { AIExecutionReporter };