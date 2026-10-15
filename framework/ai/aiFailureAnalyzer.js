const { OllamaClient } = require('./ollamaClient');

class AIFailureAnalyzer {
  constructor() {
    this.ai = new OllamaClient();
  }

  async analyzeFailure(result) {
    if (!result || result.passed !== false) {
      throw new Error('A failed test result is required');
    }

    const prompt = `
You are a Senior SDET specializing in healthcare API testing.

Analyze this failed API test.

Test ID: ${result.id}
Description: ${result.description}
Expected HTTP Status: ${result.expectedStatus}
Actual HTTP Status: ${result.actualStatus}

Provide:
1. A brief explanation of the failure.
2. Possible root causes.
3. Recommended debugging steps.

Important:
- Be concise.
- Do not invent application logs or implementation details.
- Distinguish possible causes from confirmed causes.
`;

    const analysis = await this.ai.generate(prompt);

    return {
      testId: result.id,
      expectedStatus: result.expectedStatus,
      actualStatus: result.actualStatus,
      analysis: analysis.trim()
    };
  }
}

module.exports = { AIFailureAnalyzer };