const fs = require('fs');
const path = require('path');

class AIQualityDashboard {
  constructor() {
    this.reportsRoot = path.join(process.cwd(), 'reports');
  }

  getLatestReport(folder) {
    const directory = path.join(this.reportsRoot, folder);

    if (!fs.existsSync(directory)) {
      return null;
    }

    const files = fs.readdirSync(directory)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(directory, file),
        modified: fs.statSync(path.join(directory, file)).mtimeMs
      }))
      .sort((a, b) => b.modified - a.modified);

    for (const file of files) {
      try {
        return JSON.parse(fs.readFileSync(file.path, 'utf8'));
      } catch {
        console.log(`Skipping invalid report: ${file.name}`);
      }
    }

    return null;
  }

  generate() {
    const openapi = this.getLatestReport('ai-openapi');
    const risk = this.getLatestReport('ai-risk-prioritization');
    const testData = this.getLatestReport('ai-test-data');
    const selfHealing = this.getLatestReport('ai-self-healing');

    const results = Array.isArray(openapi?.results)
      ? openapi.results
      : [];

    const metrics = {
      totalExecuted: results.filter(
        result => ['PASSED', 'FAILED'].includes(result.status)
      ).length,
      passed: results.filter(result => result.status === 'PASSED').length,
      failed: results.filter(result => result.status === 'FAILED').length,
      rejected: results.filter(result => result.status === 'REJECTED').length,
      riskScenarios: Array.isArray(risk?.priorities)
        ? risk.priorities.length
        : 0,
      generatedClaims: Array.isArray(testData?.claims)
        ? testData.claims.length
        : 0,
      repairSuggestions: selfHealing?.suggestedFix ? 1 : 0
    };

    metrics.passRate = metrics.totalExecuted > 0
      ? Number(
          ((metrics.passed / metrics.totalExecuted) * 100).toFixed(2)
        )
      : null;

    return {
      generatedAt: new Date().toISOString(),
      metrics,
      reportAvailability: {
        openapi: Boolean(openapi),
        risk: Boolean(risk),
        testData: Boolean(testData),
        selfHealing: Boolean(selfHealing)
      }
    };
  }

  save(dashboard) {
    const directory = path.join(this.reportsRoot, 'ai-quality-dashboard');

    fs.mkdirSync(directory, { recursive: true });

    const filepath = path.join(directory, 'dashboard.json');

    fs.writeFileSync(
      filepath,
      JSON.stringify(dashboard, null, 2)
    );

    return filepath;
  }
}

module.exports = { AIQualityDashboard };
