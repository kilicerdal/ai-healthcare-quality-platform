const { OllamaClient } = require('./ollamaClient');
const { SchemaValidator } = require('../validators/schemaValidator');
const scenarioSchema = require('../schemas/aiScenario.schema.json');

class AITestDataGenerator {
  constructor() {
    this.ai = new OllamaClient();
    this.validator = new SchemaValidator();
  }

  async generateScenarios() {
    const prompt = `
You are a Senior SDET generating test data for a healthcare claims API.

Return ONLY a JSON array containing exactly five objects.

Each object must contain:
- name: string
- claimAmount: JSON number (never a string)
- serviceDate: string
- expectedStatus: integer

Generate these five scenarios in this exact order:

1. Valid claim: amount 250.50, date 2026-10-10, status 201
2. Negative amount: amount -100, date 2026-10-10, status 400
3. Zero amount: amount 0, date 2026-10-10, status 400
4. Invalid date: amount 100, date 2026-02-30, status 400
5. Small positive amount: amount 0.01, date 2026-10-10, status 201

No Markdown. No explanations.
`;

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.ai.generate(prompt);

        const cleaned = response
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        const scenarios = JSON.parse(cleaned);

        const validation = this.validator.validate(
          scenarioSchema,
          scenarios
        );

        if (!validation.valid) {
          throw new Error(
            `Schema validation failed: ${JSON.stringify(validation.errors)}`
          );
        }

        const expectedStatuses = [201, 400, 400, 400, 201];

        for (let i = 0; i < scenarios.length; i++) {
          if (scenarios[i].expectedStatus !== expectedStatuses[i]) {
            throw new Error(
              `Incorrect expected status in scenario ${i + 1}`
            );
          }
        }

        console.log(`AI scenarios validated on attempt ${attempt}`);

        return scenarios;

      } catch (error) {
        console.log(
          `AI generation attempt ${attempt} failed: ${error.message}`
        );

        if (attempt === maxAttempts) {
          throw new Error(
            `AI scenario generation failed after ${maxAttempts} attempts`
          );
        }
      }
    }
  }
}

module.exports = { AITestDataGenerator };
