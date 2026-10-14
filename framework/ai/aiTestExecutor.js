class AITestExecutor {
  constructor(request, baseURL = 'http://localhost:3000') {
    this.request = request;
    this.baseURL = baseURL;
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

      console.log(
        `${scenario.id}: Expected ${scenario.expectedStatus}, ` +
        `Actual ${actualStatus} — ${passed ? 'PASS' : 'FAIL'}`
      );
    }

    return results;
  }
}

module.exports = { AITestExecutor };