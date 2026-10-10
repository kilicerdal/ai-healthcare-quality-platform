const { OllamaClient } = require('./ollamaClient');
const { RiskBasedTestSelector } = require('../risk/testSelector');

class AIRiskAnalyzer {
  constructor() {
    this.ai = new OllamaClient();
    this.selector = new RiskBasedTestSelector();
  }

  async analyze(changedFiles) {
    const selection = this.selector.selectTests(changedFiles);

    const prompt = `
You are a Senior SDET working on a healthcare claims platform.

The application uses:
- Express REST APIs
- PostgreSQL
- S3 and SQS simulations
- Playwright automation

Changed files:
${JSON.stringify(changedFiles)}

Risk analysis:
${JSON.stringify(selection.analysis)}

Selected test tags:
${JSON.stringify(selection.recommendedTags)}

Explain:
1. Business impact
2. Technical risks
3. Recommended regression coverage
4. Additional edge cases
5. Overall risk level

IMPORTANT:
Do not invent requirements.
Do not claim tests have executed.
The deterministic risk engine controls test selection.
`;

    const explanation = await this.ai.generate(prompt);

    return {
      ...selection,
      aiExplanation: explanation
    };
  }
}

module.exports = { AIRiskAnalyzer };
