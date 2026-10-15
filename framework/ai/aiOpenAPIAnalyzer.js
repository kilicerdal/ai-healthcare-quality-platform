const fs = require('fs');
const path = require('path');

const { OllamaClient } = require('./ollamaClient');

class AIOpenAPIAnalyzer {
  constructor() {
    this.ollama = new OllamaClient();
  }

  loadSpecification() {
    const filepath = path.join(
      process.cwd(),
      'openapi',
      'healthcare-api.json'
    );

    if (!fs.existsSync(filepath)) {
      throw new Error(`OpenAPI specification not found: ${filepath}`);
    }

    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }

  async generateScenarios() {
    const specification = this.loadSpecification();

    const operations = Object.entries(specification.paths).flatMap(
      ([endpoint, methods]) =>
        Object.entries(methods).map(([method, definition]) => ({
          endpoint,
          method: method.toUpperCase(),
          allowedStatuses: Object.keys(definition.responses).map(Number)
        }))
    );

    const prompt = `
You are a senior API automation engineer.

Analyze the following healthcare API operations:

${JSON.stringify(operations)}

Generate exactly 3 SHORT API test scenarios.

Use ONLY these approved scenarios:

1. POST /api/claims
   - Missing memberId
   - Expected status: 400

2. POST /api/claims
   - claimAmount = 0
   - Expected status: 400

3. GET /health
   - Health check
   - Expected status: 200

Return ONLY valid JSON.

Required JSON structure:

{
  "scenarios": [
    {
      "name": "Missing memberId",
      "method": "POST",
      "endpoint": "/api/claims",
      "expectedStatus": 400,
      "requestBody": {
        "providerId": "P100",
        "serviceDate": "2026-10-01",
        "diagnosisCode": "A10",
        "claimAmount": 100
      }
    },
    {
      "name": "Invalid claim amount",
      "method": "POST",
      "endpoint": "/api/claims",
      "expectedStatus": 400,
      "requestBody": {
        "memberId": "M100",
        "providerId": "P100",
        "serviceDate": "2026-10-01",
        "diagnosisCode": "A10",
        "claimAmount": 0
      }
    },
    {
      "name": "API health check",
      "method": "GET",
      "endpoint": "/health",
      "expectedStatus": 200,
      "requestBody": {}
    }
  ]
}

Rules:
- Generate exactly 3 scenarios.
- Use only documented API endpoints.
- Use only approved status codes.
- Do not invent business rules.
- Keep responses short.
- Return JSON only.
- No markdown.
- No explanations.
`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`\nAI generation attempt ${attempt}/3`);

        const response = await this.ollama.generate(prompt);

        if (typeof response !== 'string') {
          throw new Error('AI response must be a string');
        }

        const cleaned = response
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        const result = JSON.parse(cleaned);

        if (!Array.isArray(result.scenarios)) {
          throw new Error('AI response must contain a scenarios array');
        }

        if (result.scenarios.length !== 3) {
          throw new Error(
            `Expected exactly 3 scenarios, received ${result.scenarios.length}`
          );
        }

        const expectedRules = [
          {
            method: 'POST',
            endpoint: '/api/claims',
            expectedStatus: 400
          },
          {
            method: 'POST',
            endpoint: '/api/claims',
            expectedStatus: 400
          },
          {
            method: 'GET',
            endpoint: '/health',
            expectedStatus: 200
          }
        ];

        for (let i = 0; i < expectedRules.length; i++) {
          const scenario = result.scenarios[i];
          const expected = expectedRules[i];

          if (
            scenario.method !== expected.method ||
            scenario.endpoint !== expected.endpoint ||
            scenario.expectedStatus !== expected.expectedStatus
          ) {
            throw new Error(
              `Scenario ${i + 1} does not match approved API rules`
            );
          }

          if (
            !scenario.name ||
            typeof scenario.name !== 'string'
          ) {
            throw new Error(
              `Scenario ${i + 1} must have a valid name`
            );
          }

          if (
            !scenario.requestBody ||
            typeof scenario.requestBody !== 'object' ||
            Array.isArray(scenario.requestBody)
          ) {
            throw new Error(
              `Scenario ${i + 1} must have a valid requestBody`
            );
          }
        }

        const [missingMember, invalidAmount, healthCheck] =
          result.scenarios;

        if (
          Object.prototype.hasOwnProperty.call(
            missingMember.requestBody,
            'memberId'
          )
        ) {
          throw new Error(
            'Scenario 1 must omit memberId'
          );
        }

        if (invalidAmount.requestBody.claimAmount !== 0) {
          throw new Error(
            'Scenario 2 must use claimAmount = 0'
          );
        }

        if (
          Object.keys(healthCheck.requestBody).length !== 0
        ) {
          throw new Error(
            'Scenario 3 must have an empty requestBody'
          );
        }

        console.log('\nAI scenarios generated successfully');

        return result.scenarios;

      } catch (error) {
        console.log(
          `Attempt ${attempt} failed: ${error.message}`
        );

        if (attempt === 3) {
          throw new Error(
            `AI failed after 3 attempts: ${error.message}`
          );
        }
      }
    }
  }
}

module.exports = { AIOpenAPIAnalyzer };