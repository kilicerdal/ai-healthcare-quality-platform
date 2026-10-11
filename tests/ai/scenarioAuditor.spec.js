const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ScenarioAuditor } = require('../../framework/ai/scenarioAuditor');

test('@ai Audit incorrect AI-generated API expectations', async () => {
  const auditor = new ScenarioAuditor();

  const scenarios = [
    {
      name: 'Negative claim amount',
      memberId: 'M123',
      providerId: 'P123',
      serviceDate: '2026-10-10',
      diagnosisCode: 'Z00.00',
      claimAmount: -789,
      expectedStatus: 201
    },
    {
      name: 'Zero claim amount',
      memberId: 'M123',
      providerId: 'P123',
      serviceDate: '2026-10-10',
      diagnosisCode: 'Z00.00',
      claimAmount: 0,
      expectedStatus: 201
    },
    {
      name: 'Invalid service date',
      memberId: 'M123',
      providerId: 'P123',
      serviceDate: '2026-02-30',
      diagnosisCode: 'Z00.00',
      claimAmount: 100,
      expectedStatus: 201
    }
  ];

  const results = auditor.audit(scenarios);

  expect(results).toHaveLength(3);

  // Save audit results for the local quality dashboard.
  // These are deliberately incorrect fixtures, NOT live AI output.
  const reportDir = path.join(process.cwd(), 'reports/dashboard');
  fs.mkdirSync(reportDir, { recursive: true });

  const auditReport = {
    source: 'synthetic-test-fixtures',
    description: 'Deliberately incorrect expectations used to validate the auditor',
    generatedAt: new Date().toISOString(),
    totalAudited: results.length,
    matched: results.filter(r => !r.hallucinationDetected).length,
    mismatched: results.filter(r => r.hallucinationDetected).length,
    findings: results
  };

  fs.writeFileSync(
    path.join(reportDir, 'ai-audit-results.json'),
    JSON.stringify(auditReport, null, 2)
  );

  console.log('AI audit report saved successfully.');


  for (const result of results) {
    expect(result.hallucinationDetected).toBe(true);
    expect(result.expectedStatus).toBe(400);
    expect(result.aiExpectedStatus).toBe(201);

    console.log(
      `${result.name}: AI expected ${result.aiExpectedStatus}, actual rule ${result.expectedStatus}`
    );
  }
});
