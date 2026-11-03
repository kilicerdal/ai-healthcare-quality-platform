const { test, expect } = require("@playwright/test");
const { randomUUID } = require("node:crypto");
const pool = require("../../app/db");
const { ClaimBuilder } = require("../../framework/builders/claimBuilder");
const { DatabaseClient } = require("../../framework/clients/databaseClient");
const { APIContractValidator } = require("../../framework/validators/apiContractValidator");

for (const [label, patch] of [
  ["sub-cent amount", { claimAmount: 0.001 }],
  ["rounding amount", { claimAmount: 1.005 }],
  ["overflow amount", { claimAmount: 10000000000 }],
  ["numeric provider", { providerId: 123 }],
  ["object provider", { providerId: {} }],
  ["blank diagnosis", { diagnosisCode: " " }],
  ["overlong diagnosis", { diagnosisCode: "x".repeat(21) }],
  ["overlong provider", { providerId: "x".repeat(51) }],
]) {
  test(`@regression @api @database reject ${label} before persistence`, async ({ request }) => {
    const data = { ...new ClaimBuilder().withMemberId(`TEST-${randomUUID()}`).build(), ...patch };
    try {
      const response = await request.post("http://localhost:3000/api/claims", { data });
      expect(response.status()).toBe(400);
      const result = new APIContractValidator().validateResponse(
        "/api/claims",
        "post",
        400,
        await response.json(),
      );
      expect(result.valid).toBe(true);
      const rows = await pool.query(
        "SELECT COUNT(*)::int AS count FROM claims WHERE member_id = $1",
        [data.memberId],
      );
      expect(rows.rows[0].count).toBe(0);
    } finally {
      await new DatabaseClient().deleteClaimsByMemberId(data.memberId);
    }
  });
}

test("@regression @api parser errors use the public JSON contract", async ({ request }) => {
  for (const [data, status] of [
    ["{bad", 400],
    [JSON.stringify({ value: "x".repeat(110000) }), 413],
  ]) {
    const response = await request.post("http://localhost:3000/api/claims", {
      data,
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(status);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(
      new APIContractValidator().validateResponse(
        "/api/claims",
        "post",
        status,
        await response.json(),
      ).valid,
    ).toBe(true);
  }
});

test("@regression @api @database accept boundary amount and preserve cents", async ({
  request,
}) => {
  const memberId = `TEST-${randomUUID()}`;
  try {
    for (const claimAmount of [1.15, 9999999999.99]) {
      const response = await request.post("http://localhost:3000/api/claims", {
        data: new ClaimBuilder().withMemberId(memberId).withClaimAmount(claimAmount).build(),
      });
      expect(response.status()).toBe(201);
      expect((await response.json()).claimAmount).toBe(claimAmount);
    }
  } finally {
    await new DatabaseClient().deleteClaimsByMemberId(memberId);
  }
});
