const { OllamaClient } = require('./ollamaClient');

class AITestGenerator {
  constructor() {
    this.ai = new OllamaClient();
  }

  async generateTestScenarios(requirements) {
    const prompt = `
You are a Senior SDET specializing in healthcare API automation.

Analyze these requirements:

${requirements}

Generate exactly 5 test scenarios.

For each scenario include:
1. Test case ID
2. Scenario description
3. Test data
4. Expected result
5. Priority

Include positive, negative, and boundary testing.

Clearly distinguish documented API behavior from
additional validations that are only recommendations.
`;

    return this.ai.generate(prompt);
  }
}

module.exports = { AITestGenerator };
