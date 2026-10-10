const { OllamaClient } = require('./ollamaClient');

class AIFailureAnalyzer {
  constructor() {
    this.ai = new OllamaClient();
  }

  async analyzeFailure(testName, errorMessage) {
    const prompt = `
You are a Senior SDET investigating a failed Playwright test.

Test name:
${testName}

Error:
${errorMessage}

Provide:
1. Failure summary
2. Three possible root causes
3. Recommended debugging steps
4. Suggested code or test improvements
5. Severity: Low, Medium, or High

Important:
Do not invent logs or claim to have verified a root cause.
Distinguish observations from hypotheses.
`;

    return this.ai.generate(prompt);
  }
}

module.exports = { AIFailureAnalyzer };
