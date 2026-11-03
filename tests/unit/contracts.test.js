const { test } = require("node:test");
const assert = require("node:assert/strict");
const { SchemaValidator } = require("../../framework/validators/schemaValidator");
const { APIContractValidator } = require("../../framework/validators/apiContractValidator");
const schema = require("../../framework/schemas/claimResponse.schema.json");
const spec = require("../../openapi/healthcare-api.json");
const valid = {
  claimId: "CLM-ccfda15c-ecc9-4f9f-b38b-5dfad23e499a",
  memberId: "TEST-1",
  providerId: "PRV-1",
  serviceDate: "2026-11-03",
  diagnosisCode: "E11.9",
  claimAmount: 10,
  status: "RECEIVED",
  createdAt: "2026-11-03T12:00:00.000Z",
};

test("response contract accepts a valid claim", () => {
  assert.equal(
    new APIContractValidator().validateResponse("/api/claims", "post", 201, valid).valid,
    true,
  );
});
for (const [field, value] of [
  ["claimId", "CLM-" + "-".repeat(36)],
  ["serviceDate", "2026-02-30"],
  ["createdAt", "not a timestamp"],
  ["createdAt", "2026-11-03T12:00:00"],
  ["claimAmount", 0],
  ["status", "UNKNOWN"],
]) {
  test(`response contract rejects invalid ${field}: ${value}`, () => {
    assert.equal(new SchemaValidator().validate(schema, { ...valid, [field]: value }).valid, false);
  });
}
test("internal persistence fields cannot leak through the claim response", () => {
  assert.equal(
    new SchemaValidator().validate(schema, { ...valid, request_hash: "internal" }).valid,
    false,
  );
});
test("error contract rejects unexpected or missing error details", () => {
  const validator = new APIContractValidator();
  assert.equal(
    validator.validateResponse("/api/claims", "post", 409, { error: "Conflict" }).valid,
    true,
  );
  assert.equal(validator.validateResponse("/api/claims", "post", 409, {}).valid, false);
  assert.equal(
    validator.validateResponse("/api/claims", "post", 409, { error: "Conflict", stack: "private" })
      .valid,
    false,
  );
});
test("undocumented status cannot silently pass contract validation", () => {
  assert.throws(
    () => new APIContractValidator().validateResponse("/api/claims", "post", 202, valid),
    /No documented/,
  );
});
test("shared claim schema and OpenAPI response schema cannot drift", () => {
  assert.deepEqual(spec.components.schemas.Claim, schema);
});
