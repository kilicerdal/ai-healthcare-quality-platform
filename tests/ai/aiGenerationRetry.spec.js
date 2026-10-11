const { test, expect } = require('@playwright/test');
const { AITestDataGenerator } = require('../../framework/ai/testDataGenerator');

test('@ai Reject incorrect AI expectations and retry successfully', async () => {
  const generator = new AITestDataGenerator();

  const validScenarios = [
    {
      name: 'Valid claim',
      claimAmount: 250.50,
      serviceDate: '2026-10-10',
      expectedStatus: 201
    },
    {
      name: 'Negative amount',
      claimAmount: -100,
      serviceDate: '2026-10-10',
      expectedStatus: 400
    },
    {
      name: 'Zero amount',
      claimAmount: 0,
      serviceDate: '2026-10-10',
      expectedStatus: 400
    },
    {
      name: 'Invalid date',
      claimAmount: 100,
      serviceDate: '2026-02-30',
      expectedStatus: 400
    },
    {
      name: 'Small positive amount',
      claimAmount: 0.01,
      serviceDate: '2026-10-10',
      expectedStatus: 201
    }
  ];

  const invalidScenarios = structuredClone(validScenarios);

  invalidScenarios[1].expectedStatus = 201;

  let calls = 0;

  generator.ai.generate = async () => {
    calls++;

    return JSON.stringify(
      calls === 1 ? invalidScenarios : validScenarios
    );
  };

  const result = await generator.generateScenarios();

  expect(calls).toBe(2);
  expect(result).toEqual(validScenarios);

  console.log('AI generation attempts:', calls);
  console.log('First attempt rejected due to incorrect expectation.');
  console.log('Second attempt accepted successfully.');
});
