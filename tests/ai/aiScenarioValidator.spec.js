const { test, expect } = require('@playwright/test');
const {
  AIScenarioValidator
} = require('../../framework/validators/aiScenarioValidator');

test.describe('@ai AI Scenario Validation', () => {
  let validator;

  test.beforeEach(() => {
    validator = new AIScenarioValidator();
  });

  test('Accept valid healthcare API scenarios', () => {
    const scenarios = [
      {
        endpoint: 'POST /api/claims',
        description: 'Create a claim with all required fields',
        expectedStatus: 201
      },
      {
        endpoint: 'POST /api/claims',
        description: 'Reject a claim with a negative amount',
        expectedStatus: 400
      }
    ];

    const result = validator.validateScenarios(scenarios);

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  test('Reject unsupported API endpoints', () => {
    const scenarios = [
      {
        endpoint: 'DELETE /api/claims/123',
        description: 'Delete a healthcare claim',
        expectedStatus: 200
      }
    ];

    const result = validator.validateScenarios(scenarios);

    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('Unsupported endpoint');
  });

  test('Reject unsupported provider ID validation', () => {
    const scenarios = [
      {
        endpoint: 'POST /api/claims',
        description: 'Reject provider ID with invalid format',
        expectedStatus: 400
      }
    ];

    const result = validator.validateScenarios(scenarios);

    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain(
      'Unsupported validation requirement'
    );
  });

  test('Reject unsupported diagnosis code validation', () => {
    const scenarios = [
      {
        endpoint: 'POST /api/claims',
        description: 'Reject diagnosis code with invalid format',
        expectedStatus: 400
      }
    ];

    const result = validator.validateScenarios(scenarios);

    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain(
      'Unsupported validation requirement'
    );
  });

  test('Reject nonnumeric expected HTTP status', () => {
    const scenarios = [
      {
        endpoint: 'POST /api/claims',
        description: 'Create a healthcare claim',
        expectedStatus: '201'
      }
    ];

    const result = validator.validateScenarios(scenarios);

    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain(
      'Expected HTTP status must be an integer'
    );
  });
});