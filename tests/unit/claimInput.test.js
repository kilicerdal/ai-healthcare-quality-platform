const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateClaim } = require("../../app/validateClaim");
const valid = {
  memberId: "TEST-1",
  providerId: "PRV-1",
  serviceDate: "2026-11-03",
  diagnosisCode: "E11.9",
  claimAmount: 1.15,
};
for (const body of [undefined, null, [], "claim", 1]) {
  test(`reject non-object body ${JSON.stringify(body)}`, () => assert.ok(validateClaim(body)));
}
for (const [field, limit] of [
  ["memberId", 50],
  ["providerId", 50],
  ["diagnosisCode", 20],
]) {
  test(`validate ${field} type, whitespace, and database length`, () => {
    for (const value of [123, {}, [], true, " ", "x".repeat(limit + 1)]) {
      assert.ok(validateClaim({ ...valid, [field]: value }));
    }
    assert.equal(validateClaim({ ...valid, [field]: "x".repeat(limit) }), null);
  });
}
test("amounts are not silently rounded or allowed to overflow", () => {
  for (const amount of [0.001, 1.005, 10000000000, Infinity, NaN, "1.00", null]) {
    assert.ok(validateClaim({ ...valid, claimAmount: amount }));
  }
  for (const amount of [0.01, 1.15, 29.99, 9999999999.99]) {
    assert.equal(validateClaim({ ...valid, claimAmount: amount }), null);
  }
});
test("calendar date validation includes leap years", () => {
  assert.equal(validateClaim({ ...valid, serviceDate: "2024-02-29" }), null);
  assert.ok(validateClaim({ ...valid, serviceDate: "2026-02-29" }));
});

test("AI data validation and auditing respect the same persistence boundaries", () => {
  const { AITestDataGenerator } = require("../../framework/ai/aiTestDataGenerator");
  const { ScenarioAuditor } = require("../../framework/ai/scenarioAuditor");
  const generator = new AITestDataGenerator();
  const claim = { ...valid, claimAmount: 0.001 };
  assert.equal(generator.validateClaim(claim), false);
  const result = new ScenarioAuditor().audit([{ testData: claim, expectedStatus: 201 }])[0];
  assert.equal(result.expectedStatus, 400);
  assert.equal(result.hallucinationDetected, true);
});
