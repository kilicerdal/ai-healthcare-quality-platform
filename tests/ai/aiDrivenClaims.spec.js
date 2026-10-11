const { test, expect } = require('@playwright/test');
const { AITestDataGenerator } = require('../../framework/ai/testDataGenerator');

test('@ai Execute AI-generated healthcare claim scenarios', async ({ request }) => {
  test.setTimeout(180000);

  const generator = new AITestDataGenerator();
  const scenarios = await generator.generateScenarios();

  const expectedRules = [
    { amount: 250.50, date: '2026-10-10', status: 201 },
    { amount: -100, date: '2026-10-10', status: 400 },
    { amount: 0, date: '2026-10-10', status: 400 },
    { amount: 100, date: '2026-02-30', status: 400 },
    { amount: 0.01, date: '2026-10-10', status: 201 }
  ];

  expect(scenarios).toHaveLength(expectedRules.length);

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const rule = expectedRules[i];

    // Deterministic validation before API execution.
    expect(scenario.claimAmount).toBeCloseTo(rule.amount, 2);
    expect(scenario.serviceDate).toBe(rule.date);
    expect(scenario.expectedStatus).toBe(rule.status);

    const claim = {
      memberId: `AI-MEMBER-${Date.now()}-${i}`,
      providerId: 'AI-PROVIDER-001',
      serviceDate: scenario.serviceDate,
      diagnosisCode: 'Z00.00',
      claimAmount: scenario.claimAmount
    };

    const response = await request.post('http://localhost:3000/api/claims', {
      data: claim
    });

    console.log(
      `${scenario.name}: expected=${rule.status}, actual=${response.status()}`
    );

    expect(
      response.status(),
      `Unexpected HTTP status for ${scenario.name}`
    ).toBe(rule.status);

    if (rule.status === 201) {
      const body = await response.json();

      expect(body.claimId).toBeTruthy();
      expect(body.status).toBe('RECEIVED');
    }
  }
});
