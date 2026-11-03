const { test, expect } = require("@playwright/test");
const { randomUUID } = require("node:crypto");
const { ClaimsClient } = require("../../framework/clients/claimsClient");
const { ClaimBuilder } = require("../../framework/builders/claimBuilder");
const { APIContractValidator } = require("../../framework/validators/apiContractValidator");
const { DatabaseClient } = require("../../framework/clients/databaseClient");

for (const operation of ["create", "retrieve"]) {
  test(`@contract @regression Validate ${operation} claim response schema`, async ({ request }) => {
    const client = new ClaimsClient(request);
    const claim = new ClaimBuilder().withMemberId(`TEST-${randomUUID()}`).build();
    try {
      const createdResponse = await client.createClaim(claim);
      expect(createdResponse.status()).toBe(201);
      const created = await createdResponse.json();
      const validator = new APIContractValidator();
      const createResult = validator.validateResponse("/api/claims", "post", 201, created);
      expect(createResult.valid, JSON.stringify(createResult.errors)).toBe(true);
      if (operation === "retrieve") {
        const response = await client.getClaim(created.claimId);
        expect(response.status()).toBe(200);
        const result = validator.validateResponse(
          "/api/claims/{claimId}",
          "get",
          200,
          await response.json(),
        );
        expect(result.valid, JSON.stringify(result.errors)).toBe(true);
      }
    } finally {
      await new DatabaseClient().deleteClaimsByMemberId(claim.memberId);
    }
  });
}
