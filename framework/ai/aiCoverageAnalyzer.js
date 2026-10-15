const { OllamaClient } = require('./ollamaClient');

class AICoverageAnalyzer {
  constructor() {
    this.ai = new OllamaClient();
  }

  async analyzeCoverage() {
    const existingScenarios = [
      'Create a valid healthcare claim',
      'Create a claim without memberId',
      'Create a claim with negative claimAmount',
      'Create a claim with invalid serviceDate',
      'Create a claim with zero claimAmount'
    ];

    const apiRules = `
POST /api/claims
Required fields: memberId, providerId, serviceDate,
diagnosisCode, claimAmount.

Missing or empty required fields return 400.
claimAmount must be a positive finite number.
Invalid claimAmount returns 400.
serviceDate must be a valid YYYY-MM-DD calendar date.
Invalid serviceDate returns 400.
Valid claims return 201.

GET /api/claims/:claimId
Existing claims return 200.
Unknown claim IDs return 404.

GET /health
Returns 200.

No member lookup, provider format validation,
duplicate-claim rule, or business-hours restriction exists.
`;

    const prompt = `
You are a healthcare API test coverage analyst.

API RULES:
${apiRules}

EXISTING SCENARIOS:
${existingScenarios.join('\n')}

Recommend exactly 3 additional test scenarios.
Keep each scenario short.
Use compact JSON.
Do not include explanations or markdown.

Return ONLY valid JSON with this structure:

{
  "recommendations": [
    {
      "ruleId": "missing-required-field",
      "scenario": "Reject missing providerId",
      "method": "POST",
      "endpoint": "/api/claims",
      "expectedStatus": 400,
      "requestBody": {
        "memberId": "MEM001",
        "serviceDate": "2026-10-15",
        "diagnosisCode": "Z00.00",
        "claimAmount": 100
      }
    }
  ]
}

Allowed ruleId values:
- missing-required-field
- invalid-claim-amount
- invalid-service-date
- claim-not-found
- health-check

Use requestBody only for POST requests.
For GET requests, use an empty requestBody object.

Do not duplicate existing tests.
Do not invent API rules.
Do not include markdown or explanations outside JSON.
`;

    const response = await this.ai.generate(prompt);

    let parsed;

    try {
      const cleaned = response
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');

      parsed = JSON.parse(cleaned);
    } catch (error) {
      throw new Error(
        'AI must return exactly 3 coverage recommendations'
    );
    }

    if (
      !parsed ||
      !Array.isArray(parsed.recommendations) ||
      parsed.recommendations.length !== 3
    ) {
      throw new Error(
        'AI must return exactly 5 coverage recommendations'
      );
    }

    return {
      generatedAt: new Date().toISOString(),
      model: this.ai.model,
      existingScenarios,
      recommendations: parsed.recommendations
    };
  }
}

module.exports = { AICoverageAnalyzer };