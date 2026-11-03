const { test, expect } = require("@playwright/test");
const { randomUUID } = require("node:crypto");
const { APIContractValidator } = require("../../framework/validators/apiContractValidator");
const { ClaimBuilder } = require("../../framework/builders/claimBuilder");
const { DatabaseClient } = require("../../framework/clients/databaseClient");

async function check(response, path, method, status) {
  expect(response.status()).toBe(status);
  expect(response.headers()["content-type"]).toContain("application/json");
  const result = new APIContractValidator().validateResponse(
    path,
    method,
    status,
    await response.json(),
  );
  expect(result.valid, JSON.stringify(result.errors)).toBe(true);
}

test("@contract @regression health response matches the documented schema", async ({ request }) => {
  await check(await request.get("http://localhost:3000/health"), "/health", "get", 200);
});
test("@contract @regression validation errors match the documented schema", async ({ request }) => {
  await check(
    await request.post("http://localhost:3000/api/claims", { data: {} }),
    "/api/claims",
    "post",
    400,
  );
});
test("@contract @regression missing claim matches the documented error schema", async ({
  request,
}) => {
  await check(
    await request.get(`http://localhost:3000/api/claims/CLM-${randomUUID()}`),
    "/api/claims/{claimId}",
    "get",
    404,
  );
});
test("@contract @regression replay and conflict responses match the API specification", async ({
  request,
}) => {
  const data = new ClaimBuilder().withMemberId(`TEST-${randomUUID()}`).build();
  const headers = { "Idempotency-Key": randomUUID() };
  try {
    await check(
      await request.post("http://localhost:3000/api/claims", { data, headers }),
      "/api/claims",
      "post",
      201,
    );
    await check(
      await request.post("http://localhost:3000/api/claims", { data, headers }),
      "/api/claims",
      "post",
      201,
    );
    await check(
      await request.post("http://localhost:3000/api/claims", {
        data: { ...data, claimAmount: data.claimAmount + 1 },
        headers,
      }),
      "/api/claims",
      "post",
      409,
    );
  } finally {
    await new DatabaseClient().deleteClaimsByMemberId(data.memberId);
  }
});
