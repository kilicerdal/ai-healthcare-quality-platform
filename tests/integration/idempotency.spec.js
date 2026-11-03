const { test, expect } = require("@playwright/test");
const { randomUUID } = require("node:crypto");
const pool = require("../../app/db");
const { ClaimBuilder } = require("../../framework/builders/claimBuilder");
const { DatabaseClient } = require("../../framework/clients/databaseClient");

function payload() {
  return new ClaimBuilder().withMemberId(`TEST-${randomUUID()}`).build();
}

test("@regression @api @database concurrent retries create one claim", async ({ request }) => {
  const data = payload();
  const key = randomUUID();
  try {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request.post("http://localhost:3000/api/claims", {
          data,
          headers: { "Idempotency-Key": key },
        }),
      ),
    );
    for (const response of responses) expect(response.status()).toBe(201);
    const claims = await Promise.all(responses.map((r) => r.json()));
    expect(new Set(claims.map((c) => c.claimId)).size).toBe(1);
    const result = await pool.query(
      "SELECT COUNT(*)::int AS count FROM claims WHERE member_id = $1",
      [data.memberId],
    );
    expect(result.rows[0].count).toBe(1);
    const conflict = await request.post("http://localhost:3000/api/claims", {
      data: { ...data, claimAmount: data.claimAmount + 10 },
      headers: { "Idempotency-Key": key },
    });
    expect(conflict.status()).toBe(409);
    const stored = await request.get(`http://localhost:3000/api/claims/${claims[0].claimId}`);
    expect((await stored.json()).claimAmount).toBe(data.claimAmount);
  } finally {
    await new DatabaseClient().deleteClaimsByMemberId(data.memberId);
  }
});

test("@regression @api unkeyed requests still create independent claims", async ({ request }) => {
  const data = payload();
  try {
    const claims = [];
    for (let i = 0; i < 2; i++) {
      const response = await request.post("http://localhost:3000/api/claims", { data });
      expect(response.status()).toBe(201);
      claims.push(await response.json());
    }
    expect(claims[0].claimId).not.toBe(claims[1].claimId);
    const invalid = await request.post("http://localhost:3000/api/claims", {
      data,
      headers: { "Idempotency-Key": "x".repeat(129) },
    });
    expect(invalid.status()).toBe(400);
  } finally {
    await new DatabaseClient().deleteClaimsByMemberId(data.memberId);
  }
});
