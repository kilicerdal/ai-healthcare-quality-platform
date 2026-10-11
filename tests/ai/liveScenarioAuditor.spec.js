const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { AITestDataGenerator } = require('../../framework/ai/testDataGenerator');
const { LiveScenarioAuditor } = require('../../framework/ai/liveScenarioAuditor');

test('@ai Audit live Ollama-generated healthcare scenarios', async () => {
  test.setTimeout(180000);

  const generator = new AITestDataGenerator();
  const auditor = new LiveScenarioAuditor();

  const scenarios = await generator.generateScenarios();
  const findings = auditor.audit(scenarios);

  const report = {
    source: 'live-ollama-generated-scenarios',
    generatedAt: new Date().toISOString(),
    totalAudited: findings.length,
    matched: findings.filter(f => !f.hallucinationDetected).length,
    mismatched: findings.filter(f => f.hallucinationDetected).length,
    findings
  };

  const reportDir = path.join(process.cwd(), 'reports/dashboard');

  fs.mkdirSync(reportDir, { recursive: true });

  fs.writeFileSync(
    path.join(reportDir, 'live-ai-audit-results.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('Live AI scenarios audited:', report.totalAudited);
  console.log('Matching expectations:', report.matched);
  console.log('Incorrect expectations:', report.mismatched);

  expect(findings).toHaveLength(5);
  expect(report.mismatched).toBe(0);
});
