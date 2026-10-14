class AIScenarioValidator {
  constructor() {
    this.supportedEndpoints = [
      'POST /api/claims',
      'GET /api/claims/:claimId'
    ];

    this.unsupportedValidationPatterns = [
      /\bprovider\s*id\b.{0,80}\b(format|length|pattern)\b/i,
      /\bmember\s*id\b.{0,80}\b(format|length|pattern)\b/i,
      /\bdiagnosis\s*code\b.{0,80}\b(format|length|pattern)\b/i,
      /\b(icd-?10)\b.{0,80}\b(validation|format|invalid)\b/i
    ];
  }

  validateScenario(scenario) {
    const issues = [];

    if (!scenario || typeof scenario !== 'object') {
      return {
        valid: false,
        issues: ['Scenario must be an object']
      };
    }

    const endpoint = scenario.endpoint || '';
    const description = scenario.description || '';
    const expectedStatus = scenario.expectedStatus;

    if (!this.supportedEndpoints.includes(endpoint)) {
      issues.push(`Unsupported endpoint: ${endpoint}`);
    }

    if (!Number.isInteger(expectedStatus)) {
      issues.push('Expected HTTP status must be an integer');
    }

    for (const pattern of this.unsupportedValidationPatterns) {
      if (pattern.test(description)) {
        issues.push(
          `Unsupported validation requirement: ${description}`
        );
        break;
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  validateScenarios(scenarios) {
    if (!Array.isArray(scenarios)) {
      return {
        valid: false,
        results: [],
        issues: ['Scenarios must be an array']
      };
    }

    const results = scenarios.map((scenario, index) => ({
      index: index + 1,
      ...this.validateScenario(scenario)
    }));

    return {
      valid: results.every(result => result.valid),
      results,
      issues: results.flatMap(result => result.issues)
    };
  }
}

module.exports = { AIScenarioValidator };