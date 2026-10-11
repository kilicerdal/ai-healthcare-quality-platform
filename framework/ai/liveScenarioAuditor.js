const { ScenarioAuditor } = require('./scenarioAuditor');

class LiveScenarioAuditor {
  constructor() {
    this.auditor = new ScenarioAuditor();
  }

  audit(scenarios) {
    const completeScenarios = scenarios.map((scenario, index) => ({
      ...scenario,
      memberId: `AI-AUDIT-${index + 1}`,
      providerId: 'AI-PROVIDER-001',
      diagnosisCode: 'Z00.00'
    }));

    return this.auditor.audit(completeScenarios);
  }
}

module.exports = { LiveScenarioAuditor };
