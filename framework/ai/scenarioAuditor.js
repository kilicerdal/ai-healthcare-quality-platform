const { validateClaim } = require("../../app/validateClaim");
class ScenarioAuditor {
  audit(scenarios) {
    return scenarios.map((scenario) => {
      const data = scenario.testData || scenario;

      const expectedStatus = validateClaim(data) === null ? 201 : 400;

      const aiExpectedStatus = scenario.expectedStatus;

      return {
        name: scenario.name || scenario.scenarioDescription || "Unnamed scenario",
        aiExpectedStatus,
        expectedStatus,
        hallucinationDetected: aiExpectedStatus !== expectedStatus,
        reason:
          aiExpectedStatus !== expectedStatus
            ? "AI expectation conflicts with deterministic API rules"
            : "AI expectation matches API rules",
      };
    });
  }
}

module.exports = { ScenarioAuditor };
