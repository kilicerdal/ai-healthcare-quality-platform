const { test } = require("node:test");
const assert = require("node:assert/strict");
const { AIScenarioValidator } = require("../../framework/validators/aiScenarioValidator");
const { AICoverageValidator } = require("../../framework/validators/aiCoverageValidator");

for (const input of [null, [], "scenario", 1]) {
  test(`reject malformed scenario ${JSON.stringify(input)}`, () => {
    assert.equal(new AIScenarioValidator().validateScenario(input).valid, false);
    assert.equal(new AICoverageValidator().validate(input).valid, false);
  });
}
for (const status of [0, 99, 600, 200, 404, 500]) {
  test(`POST scenario rejects unsupported HTTP ${status}`, () => {
    assert.equal(
      new AIScenarioValidator().validateScenario({
        endpoint: "POST /api/claims",
        description: "Create a claim",
        expectedStatus: status,
      }).valid,
      false,
    );
  });
}
for (const ruleId of ["toString", "constructor", "__proto__"]) {
  test(`inherited rule ${ruleId} cannot bypass approval`, () => {
    assert.equal(new AICoverageValidator().validate({ ruleId }).valid, false);
  });
}
test("empty scenario batches are not a successful validation", () => {
  assert.equal(new AIScenarioValidator().validateScenarios([]).valid, false);
});
test("description must be nonempty text", () => {
  for (const description of ["", [], {}, null]) {
    assert.equal(
      new AIScenarioValidator().validateScenario({
        endpoint: "POST /api/claims",
        expectedStatus: 201,
        description,
      }).valid,
      false,
    );
  }
});
test("supported GET result remains valid", () => {
  assert.equal(
    new AIScenarioValidator().validateScenario({
      endpoint: "GET /api/claims/:claimId",
      expectedStatus: 404,
      description: "Unknown claim",
    }).valid,
    true,
  );
});
