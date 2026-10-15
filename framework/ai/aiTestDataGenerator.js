const fs = require('fs');
const path = require('path');

const { OllamaClient } = require('./ollamaClient');

class AITestDataGenerator {
  constructor() {
    this.ollama = new OllamaClient();
  }

  validateClaim(claim) {
    if (!claim || typeof claim !== 'object' || Array.isArray(claim)) {
      return false;
    }

    const requiredStrings = [
      'memberId',
      'providerId',
      'serviceDate',
      'diagnosisCode'
    ];

    if (requiredStrings.some(
      field => typeof claim[field] !== 'string' || !claim[field].trim()
    )) {
      return false;
    }

    if (
      typeof claim.claimAmount !== 'number' ||
      !Number.isFinite(claim.claimAmount) ||
      claim.claimAmount <= 0
    ) {
      return false;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(claim.serviceDate);

    if (!match) return false;

    const [, year, month, day] = match.map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  async generate() {
    const prompt = `
Generate exactly 3 fictional healthcare claims for API testing.

Return ONLY compact JSON in this format:
{
  "claims": [
    {
      "memberId": "TEST-M001",
      "providerId": "TEST-P001",
      "serviceDate": "2026-10-01",
      "diagnosisCode": "A10",
      "claimAmount": 125.50
    }
  ]
}

Requirements:
- Exactly 3 claims.
- All fields are required.
- Use fictional TEST identifiers only.
- serviceDate must be a real YYYY-MM-DD date.
- claimAmount must be a positive number.
- Do not include real patient information.
- No markdown or explanations.
`;

    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`AI data generation attempt ${attempt}/3`);

        const response = await this.ollama.generate(prompt);

        if (typeof response !== 'string') {
          throw new Error('AI response must be text');
        }

        const cleaned = response
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed.claims) || parsed.claims.length !== 3) {
          throw new Error('Expected exactly 3 claims');
        }

        if (!parsed.claims.every(claim => this.validateClaim(claim))) {
          throw new Error('Generated claims failed validation');
        }

        if (!parsed.claims.every(
          claim =>
            claim.memberId.startsWith('TEST-') &&
            claim.providerId.startsWith('TEST-')
        )) {
          throw new Error('Claims must use fictional TEST identifiers');
        }

        return parsed.claims;
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed: ${error.message}`);
      }
    }

    throw new Error(
      `AI test data generation failed: ${lastError.message}`
    );
  }

  saveReport(claims) {
    const directory = path.join(
      process.cwd(),
      'reports',
      'ai-test-data'
    );

    fs.mkdirSync(directory, { recursive: true });

    const filepath = path.join(
      directory,
      `generated-claims-${Date.now()}.json`
    );

    fs.writeFileSync(
      filepath,
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        totalClaims: claims.length,
        claims
      }, null, 2)
    );

    return filepath;
  }
}

module.exports = { AITestDataGenerator };
