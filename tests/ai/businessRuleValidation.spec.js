const { test, expect } = require('@playwright/test');
const { LiveScenarioAuditor } = require('../../framework/ai/liveScenarioAuditor');

test('@ai Detect incorrect AI expectations using deterministic rules', async () => {
  const auditor = new LiveScenarioAuditor();

  const scenarios = [
    {
      name: 'Valid claim',
      claimAmount: 250.50,
      serviceDate: '2026-10-10',
      expectedStatus: 201
    },
    {
      name: 'Negative amount with incorrect AI expectation',
      claimAmount: -100,
      serviceDate: '2026-10-10',
      expectedStatus: 201
    },
    {
      name: 'Zero amount',
      claimAmount: 0,
      serviceDate: '2026-10-10',
      expectedStatus: 400
    },
    {
      name: 'Invalid date with incorrect AI expectation',
      claimAmount: 100,
      serviceDate: '2026-02-30',
      expectedStatus: 201
    },
    {
      name: 'Small positive amount',
      claimAmount: 0.01,
      serviceDate: '2026-10-10',
      expectedStatus: 201
    }
  ];

  const findings = auditor.audit(scenarios);

  const mismatches = findings.filter(
    (finding) => finding.hallucinationDetected
  );

  expect(findings).toHaveLength(5);
  expect(mismatches).toHaveLength(2);

  expect(mismatches.map((finding) => finding.name)).toEqual([
    'Negative amount with incorrect AI expectation',
    'Invalid date with incorrect AI expectation'
  ]);

  console.log('Total scenarios:', findings.length);
  console.log('Incorrect AI expectations detected:', mismatches.length);
});
