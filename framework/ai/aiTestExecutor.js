
const { AIFailureReporter } = require('./aiFailureReporter');
const { AIFailureAnalyzer } = require('./aiFailureAnalyzer');
class AITestExecutor {
  constructor(request, baseURL = 'http://localhost:3000') {
  this.failureReporter = new AIFailureReporter();
  this.request = request;
  this.baseURL = baseURL;
  this.failureAnalyzer = new AIFailureAnalyzer();
}

  async executeScenarios(scenarios) {
    const results = [];

    for (const scenario of scenarios) {
      console.log(`\nExecuting ${scenario.id}: ${scenario.description}`);

      if (scenario.endpoint !== 'POST /api/claims') {
        throw new Error(`Unsupported endpoint: ${scenario.endpoint}`);
      }

      const response = await this.request.post(
        `${this.baseURL}/api/claims`,
        {
          data: scenario.testData
        }
      );

      const actualStatus = response.status();
      const passed = actualStatus === scenario.expectedStatus;

      const result = {
        id: scenario.id,
        description: scenario.description,
        expectedStatus: scenario.expectedStatus,
        actualStatus,
        passed
      };

      results.push(result);
      if (!passed) {
  console.log(`\nAI analyzing failure for ${scenario.id}...`);

  try {
    const analysis = await this.failureAnalyzer.analyzeFailure(result);

    result.aiAnalysis = analysis.analysis;

    console.log('\n===== AI FAILURE ANALYSIS =====');
    console.log(result.aiAnalysis);
  } catch (error) {
    result.aiAnalysisError = error.message;

    console.warn(
      `AI failure analysis unavailable: ${error.message}`
    );
  }
}

      console.log(
        `${scenario.id}: Expected ${scenario.expectedStatus}, ` +
        `Actual ${actualStatus} — ${passed ? 'PASS' : 'FAIL'}`
      );
    }
    this.failureReporter.save(results);
    return results;
  }
}

module.exports = { AITestExecutor };