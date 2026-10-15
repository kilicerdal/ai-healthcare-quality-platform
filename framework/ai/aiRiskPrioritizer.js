const fs = require('fs');
const path = require('path');

const { OllamaClient } = require('./ollamaClient');

class AIRiskPrioritizer {
  constructor() {
    this.ollama = new OllamaClient();
  }

  getScenarios() {
    return [
      {
        id: 'TC001',
        name: 'Health endpoint availability',
        endpoint: '/health',
        method: 'GET',
        criticality: 'MEDIUM'
      },
      {
        id: 'TC002',
        name: 'Reject missing memberId',
        endpoint: '/api/claims',
        method: 'POST',
        criticality: 'HIGH'
      },
      {
        id: 'TC003',
        name: 'Reject zero claim amount',
        endpoint: '/api/claims',
        method: 'POST',
        criticality: 'HIGH'
      },
      {
        id: 'TC004',
        name: 'Create valid healthcare claim',
        endpoint: '/api/claims',
        method: 'POST',
        criticality: 'HIGH'
      },
      {
        id: 'TC005',
        name: 'Retrieve existing healthcare claim',
        endpoint: '/api/claims/{claimId}',
        method: 'GET',
        criticality: 'HIGH'
      }
    ];
  }

  async prioritize() {
    const scenarios = this.getScenarios();

    const prompt = `
You are a senior healthcare QA engineer.

Evaluate these API test scenarios:
${JSON.stringify(scenarios)}

Assign a risk score from 1 to 10 for each scenario.

Consider:
- Business impact
- API criticality
- Potential failure impact

Return ONLY compact JSON:

{
  "priorities": [
    {
      "id": "TC001",
      "riskScore": 5,
      "reason": "Short explanation"
    }
  ]
}

Rules:
- Include all 5 scenario IDs exactly once.
- Scores must be integers from 1 to 10.
- No markdown.
- No explanations outside JSON.
`;

    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`AI risk analysis attempt ${attempt}/3`);

        const response = await this.ollama.generate(prompt);

        if (typeof response !== 'string') {
          throw new Error('AI response must be text');
        }

        const cleaned = response
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        const parsed = JSON.parse(cleaned);

        if (
          !Array.isArray(parsed.priorities) ||
          parsed.priorities.length !== scenarios.length
        ) {
          throw new Error('Expected exactly 5 risk priorities');
        }

        const validIds = new Set(scenarios.map(s => s.id));
        const returnedIds = parsed.priorities.map(p => p.id);

        if (
          new Set(returnedIds).size !== scenarios.length ||
          returnedIds.some(id => !validIds.has(id))
        ) {
          throw new Error('Invalid or duplicate scenario IDs');
        }

        for (const priority of parsed.priorities) {
          if (
            !Number.isInteger(priority.riskScore) ||
            priority.riskScore < 1 ||
            priority.riskScore > 10 ||
            typeof priority.reason !== 'string' ||
            !priority.reason.trim()
          ) {
            throw new Error('Invalid risk score or reason');
          }
        }

        const ranked = scenarios.map(scenario => {
          const ai = parsed.priorities.find(p => p.id === scenario.id);

          const minimumScore =
            scenario.criticality === 'HIGH' ? 8 : 1;

          return {
            ...scenario,
            aiRiskScore: ai.riskScore,
            finalRiskScore: Math.max(ai.riskScore, minimumScore),
            reason: ai.reason
          };
        });

        return ranked.sort(
          (a, b) =>
            b.finalRiskScore - a.finalRiskScore ||
            a.id.localeCompare(b.id)
        );
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed: ${error.message}`);
      }
    }

    throw new Error(
      `AI risk prioritization failed: ${lastError.message}`
    );
  }

  saveReport(priorities) {
    const directory = path.join(
      process.cwd(),
      'reports',
      'ai-risk-prioritization'
    );

    fs.mkdirSync(directory, { recursive: true });

    const filepath = path.join(
      directory,
      `risk-report-${Date.now()}.json`
    );

    fs.writeFileSync(
      filepath,
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        priorities
      }, null, 2)
    );

    return filepath;
  }
}

module.exports = { AIRiskPrioritizer };
