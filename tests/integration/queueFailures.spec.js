const { test, expect } = require("@playwright/test");
const { randomUUID } = require("node:crypto");
const { ClaimBuilder } = require("../../framework/builders/claimBuilder");
const { S3StorageClient } = require("../../framework/clients/s3Client");
const { SQSQueueClient } = require("../../framework/clients/sqsClient");
const { SQSClaimsProcessor } = require("../../app/sqsClaimsProcessor");
const { ClaimsProcessor } = require("../../app/claimsProcessor");
const { DatabaseClient } = require("../../framework/clients/databaseClient");

for (const failure of ["malformed JSON", "missing S3 object", "API rejection"]) {
  test(`@regression @sqs @integration ${failure} does not block a valid claim`, async ({
    request,
  }) => {
    const queue = await SQSQueueClient.createIsolatedQueue(`test-failures-${randomUUID()}`);
    const storage = new S3StorageClient();
    const data = new ClaimBuilder().withMemberId(`TEST-${randomUUID()}`).build();
    const validKey = `test/${randomUUID()}.json`;
    const badKey = `test/${randomUUID()}.json`;
    try {
      await storage.uploadClaim(validKey, data);
      if (failure === "malformed JSON") await queue.sendMessageBody("{broken");
      else {
        if (failure === "API rejection")
          await storage.uploadClaim(badKey, { ...data, claimAmount: -1 });
        await queue.sendClaimMessage(badKey);
      }
      await queue.sendClaimMessage(validKey);
      let error;
      try {
        await new SQSClaimsProcessor(request, { sqsClient: queue }).processMessages();
      } catch (caught) {
        error = caught;
      }
      expect(error).toBeInstanceOf(AggregateError);
      expect(error.errors).toHaveLength(1);
      expect(error.processedClaims).toHaveLength(1);
      expect(error.processedClaims[0].memberId).toBe(data.memberId);
      const stored = await new DatabaseClient().getClaimById(error.processedClaims[0].claimId);
      expect(stored.member_id).toBe(data.memberId);
    } finally {
      await Promise.all([
        queue.deleteQueue(),
        storage.deleteClaim(validKey),
        storage.deleteClaim(badKey),
        new DatabaseClient().deleteClaimsByMemberId(data.memberId),
      ]);
    }
  });
}

test("@regression @sqs @integration retry after failed acknowledgement returns original claim", async ({
  request,
}) => {
  const queue = await SQSQueueClient.createIsolatedQueue(`test-retry-${randomUUID()}`);
  const storage = new S3StorageClient();
  const data = new ClaimBuilder().withMemberId(`TEST-${randomUUID()}`).build();
  const key = `test/${randomUUID()}.json`;
  try {
    await storage.uploadClaim(key, data);
    await queue.sendClaimMessage(key);
    const first = await new ClaimsProcessor(request).processClaim(key);
    const wrapper = Object.create(queue);
    wrapper.deleteMessage = async (receipt) => {
      await queue.releaseMessage(receipt);
      throw new Error("Simulated acknowledgement failure");
    };
    await expect(
      new SQSClaimsProcessor(request, { sqsClient: wrapper }).processMessages(),
    ).rejects.toThrow(AggregateError);
    const retried = await new SQSClaimsProcessor(request, { sqsClient: queue }).processMessages();
    expect(retried).toHaveLength(1);
    expect(retried[0].claimId).toBe(first.claimId);
    await storage.uploadClaim(key, { ...data, claimAmount: data.claimAmount + 10 });
    await expect(new ClaimsProcessor(request).processClaim(key)).rejects.toThrow(
      "HTTP status: 409",
    );
  } finally {
    await Promise.all([
      queue.deleteQueue(),
      storage.deleteClaim(key),
      new DatabaseClient().deleteClaimsByMemberId(data.memberId),
    ]);
  }
});
