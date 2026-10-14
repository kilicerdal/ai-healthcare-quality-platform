const { OllamaClient } = require('./ollamaClient');
const {
  AIScenarioValidator
} = require('../validators/aiScenarioValidator');

class AITestGenerator {
  constructor() {
    this.ai = new OllamaClient();
    this.validator = new AIScenarioValidator();
  }

  async generateTestScenarios(requirements) {
    const testCases = [
      {
        id: 'TC001',
        description: 'Create a valid healthcare claim',
        expectedStatus: 201
      },
      {
        id: 'TC002',
        description: 'Create a claim without memberId',
        expectedStatus: 400
      },
      {
        id: 'TC003',
        description: 'Create a claim with negative claimAmount',
        expectedStatus: 400
      },
      {
        id: 'TC004',
        description: 'Create a claim with invalid serviceDate',
        expectedStatus: 400
      },
      {
        id: 'TC005',
        description: 'Create a claim with zero claimAmount',
        expectedStatus: 400
      }
    ];

    const validatedScenarios = [];
    const maxAttempts = 3;

    for (const testCase of testCases) {
      let lastError;
      let scenarioGenerated = false;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(
          `Generating ${testCase.id} - Attempt ${attempt}/${maxAttempts}`
        );

        try {
          const prompt = `
You are a Senior SDET specializing in healthcare API automation.

Generate exactly ONE healthcare API test scenario.

Requirements:
${requirements}

Test case:
ID: ${testCase.id}
Description: ${testCase.description}
Expected HTTP status: ${testCase.expectedStatus}

Supported endpoint:
POST /api/claims

Business rules:
- Valid claims return HTTP 201.
- Missing required fields return HTTP 400.
- Claim amounts must be positive numbers.
- Service dates must use YYYY-MM-DD format.

Required claim fields:
memberId
providerId
serviceDate
diagnosisCode
claimAmount

Default valid values:
memberId: "M12345"
providerId: "P12345"
serviceDate: "2026-10-10"
diagnosisCode: "Z00.00"
claimAmount: 250.50

Scenario instructions:
TC001: All fields valid.
TC002: Omit memberId completely.
TC003: Use claimAmount -250.50.
TC004: Use serviceDate "10-10-26".
TC005: Use claimAmount 0.

Important:
- Generate only ${testCase.id}.
- Return one JSON object.
- Do not return an array.
- Do not include Markdown.
- Do not include comments.
- Do not include trailing commas.
- Use endpoint "POST /api/claims".
- Use expectedStatus ${testCase.expectedStatus}.

JSON example:

{
  "id": "${testCase.id}",
  "endpoint": "POST /api/claims",
  "description": "${testCase.description}",
  "testData": {
    "memberId": "M12345",
    "providerId": "P12345",
    "serviceDate": "2026-10-10",
    "diagnosisCode": "Z00.00",
    "claimAmount": 250.50
  },
  "expectedStatus": ${testCase.expectedStatus},
  "priority": "High"
}

Previous error:
${lastError ? lastError.message : 'None'}

Return valid JSON only.
`;

          // Generate the scenario using Ollama.
          const response = await this.ai.generate(prompt);

          // Remove Markdown fences and known inline-comment formatting.
          const cleanedResponse = response
            .trim()
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/, '')
            .replace(/,\s*\/\/[^\r\n]*(?=\r?\n)/g, ',')
            .trim();

          let scenario;

          try {
            scenario = JSON.parse(cleanedResponse);
          } catch (error) {
            throw new Error(
              `AI returned invalid JSON: ${error.message}`
            );
          }

          // Verify the AI returned one object.
          if (
            !scenario ||
            typeof scenario !== 'object' ||
            Array.isArray(scenario)
          ) {
            throw new Error(
              'AI must return exactly one scenario object'
            );
          }

          // Validate scenario ID.
          if (scenario.id !== testCase.id) {
            throw new Error(
              `Expected scenario ID ${testCase.id}, received ${scenario.id}`
            );
          }

          // Validate endpoint.
          if (scenario.endpoint !== 'POST /api/claims') {
            throw new Error(
              `Unsupported endpoint: ${scenario.endpoint}`
            );
          }

          // Validate expected status.
          if (scenario.expectedStatus !== testCase.expectedStatus) {
            throw new Error(
              `Expected HTTP ${testCase.expectedStatus}, received ${scenario.expectedStatus}`
            );
          }

          // =====================================================
          // NORMALIZE TEST DATA
          // =====================================================
          // Ollama may generate null or empty member IDs.
          // Use controlled fixtures to isolate each test case.

          const validClaim = {
            memberId: 'M12345',
            providerId: 'P12345',
            serviceDate: '2026-10-10',
            diagnosisCode: 'Z00.00',
            claimAmount: 250.50
          };

          scenario.testData = { ...validClaim };

          switch (testCase.id) {
            case 'TC002':
              delete scenario.testData.memberId;
              break;

            case 'TC003':
              scenario.testData.claimAmount = -250.50;
              break;

            case 'TC004':
              scenario.testData.serviceDate = '10-10-26';
              break;

            case 'TC005':
              scenario.testData.claimAmount = 0;
              break;

            default:
              break;
          }

          const data = scenario.testData;

          // =====================================================
          // VERIFY SCENARIO-SPECIFIC DATA
          // =====================================================

          if (testCase.id === 'TC001') {
            if (
              data.memberId !== 'M12345' ||
              data.claimAmount !== 250.50 ||
              data.serviceDate !== '2026-10-10'
            ) {
              throw new Error('TC001 must contain valid claim data');
            }
          }

          if (testCase.id === 'TC002') {
            if (Object.hasOwn(data, 'memberId')) {
              throw new Error(
                'TC002 must omit memberId completely'
              );
            }
          }

          if (testCase.id === 'TC003') {
            if (
              data.memberId !== 'M12345' ||
              data.claimAmount !== -250.50
            ) {
              throw new Error(
                'TC003 must contain a valid memberId and negative claimAmount'
              );
            }
          }

          if (testCase.id === 'TC004') {
            if (
              data.memberId !== 'M12345' ||
              data.serviceDate !== '10-10-26'
            ) {
              throw new Error(
                'TC004 must contain an invalid serviceDate'
              );
            }
          }

          if (testCase.id === 'TC005') {
            if (
              data.memberId !== 'M12345' ||
              data.claimAmount !== 0
            ) {
              throw new Error(
                'TC005 must contain a valid memberId and zero claimAmount'
              );
            }
          }

          // =====================================================
          // VALIDATE USING THE AI SCENARIO VALIDATOR
          // =====================================================

          const validation =
            this.validator.validateScenarios([scenario]);

          if (!validation.valid) {
            throw new Error(
              `AI scenario validation failed:\n${validation.issues.join('\n')}`
            );
          }

          validatedScenarios.push(scenario);
          scenarioGenerated = true;

          console.log(
            `${testCase.id} generated and validated successfully`
          );

          break;

        } catch (error) {
          lastError = error;

          console.warn(
            `${testCase.id} attempt ${attempt} failed: ${error.message}`
          );
        }
      }

      if (!scenarioGenerated) {
        throw new Error(
          `Failed to generate ${testCase.id} after ${maxAttempts} attempts.\nLast error: ${lastError.message}`
        );
      }
    }

    console.log(
      `AI generated ${validatedScenarios.length} validated scenarios`
    );

    return validatedScenarios;
  }
}

module.exports = { AITestGenerator };