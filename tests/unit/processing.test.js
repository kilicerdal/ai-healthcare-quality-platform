const { test } = require("node:test");
const assert = require("node:assert/strict");
const { SQSClaimsProcessor } = require("../../app/sqsClaimsProcessor");
const { ClaimsProcessor } = require("../../app/claimsProcessor");

function message(key = "claim.json", receipt = "receipt") {
  return {
    Body: JSON.stringify({ key, bucket: "healthcare-claims-local" }),
    ReceiptHandle: receipt,
  };
}
function batch(messages, processClaim = async (key) => ({ key }), deleteMessage = async () => {}) {
  return new SQSClaimsProcessor(null, {
    sqsClient: {
      bucketName: "healthcare-claims-local",
      receiveMessages: async () => messages,
      deleteMessage,
    },
    claimsProcessor: { processClaim },
  });
}

test("a malformed message does not block a later valid message", async () => {
  const acknowledged = [];
  const processor = batch(
    [{ Body: "{broken", ReceiptHandle: "bad" }, message()],
    async (key) => ({ key }),
    async (receipt) => acknowledged.push(receipt),
  );
  await assert.rejects(processor.processMessages(), (error) => {
    assert.equal(error.errors.length, 1);
    assert.deepEqual(error.processedClaims, [{ key: "claim.json" }]);
    return true;
  });
  assert.deepEqual(acknowledged, ["receipt"]);
});

for (const body of [null, [], {}, { key: "" }, { key: 2 }, { key: "ok", bucket: "other" }]) {
  test(`invalid message body is retained: ${JSON.stringify(body)}`, async () => {
    let calls = 0;
    await assert.rejects(
      batch(
        [{ Body: JSON.stringify(body), ReceiptHandle: "bad" }],
        async () => {
          calls++;
        },
        async () => {
          calls++;
        },
      ).processMessages(),
      AggregateError,
    );
    assert.equal(calls, 0);
  });
}

test("processing failure leaves message unacknowledged and continues the batch", async () => {
  const acknowledged = [];
  await assert.rejects(
    batch(
      [message("missing", "bad"), message("ok", "good")],
      async (key) => {
        if (key === "missing") throw new Error("NoSuchKey");
        return { key };
      },
      async (receipt) => acknowledged.push(receipt),
    ).processMessages(),
    AggregateError,
  );
  assert.deepEqual(acknowledged, ["good"]);
});

test("acknowledgement failure is reported without claiming success", async () => {
  await assert.rejects(
    batch(
      [message()],
      async () => ({ claimId: "1" }),
      async () => {
        throw new Error("queue unavailable");
      },
    ).processMessages(),
    (error) => {
      assert.deepEqual(error.processedClaims, []);
      assert.equal(error.errors[0].cause.message, "queue unavailable");
      return true;
    },
  );
});

test("missing receipt never starts claim processing", async () => {
  let calls = 0;
  await assert.rejects(
    batch([{ Body: message().Body }], async () => {
      calls++;
    }).processMessages(),
  );
  assert.equal(calls, 0);
});

test("queue receive failure propagates", async () => {
  const processor = new SQSClaimsProcessor(null, {
    sqsClient: {
      receiveMessages: async () => {
        throw new Error("receive failed");
      },
    },
    claimsProcessor: {},
  });
  await assert.rejects(processor.processMessages(), /receive failed/);
});

for (const failure of ["NoSuchKey", "invalid JSON"]) {
  test(`storage failure prevents API submission: ${failure}`, async () => {
    let posts = 0;
    const processor = new ClaimsProcessor(
      {
        post: async () => {
          posts++;
        },
      },
      {
        s3Client: {
          getClaim: async () => {
            throw new Error(failure);
          },
        },
      },
    );
    await assert.rejects(processor.processClaim("claim.json"), new RegExp(failure));
    assert.equal(posts, 0);
  });
}

for (const status of [400, 500]) {
  test(`API HTTP ${status} is a failed claim`, async () => {
    const processor = new ClaimsProcessor(
      { post: async () => ({ status: () => status }) },
      {
        s3Client: { getClaim: async () => ({ memberId: "TEST-1" }) },
      },
    );
    await assert.rejects(
      processor.processClaim("claim.json"),
      new RegExp(`HTTP status: ${status}`),
    );
  });
}

test("successful claim returns the API payload", async () => {
  const claim = { claimId: "CLM-1" };
  const processor = new ClaimsProcessor(
    { post: async () => ({ status: () => 201, json: async () => claim }) },
    {
      s3Client: { getClaim: async () => ({ memberId: "TEST-1" }) },
    },
  );
  assert.deepEqual(await processor.processClaim("claim.json"), claim);
});

test("API transport failure propagates without returning a claim", async () => {
  const processor = new ClaimsProcessor(
    {
      post: async () => {
        throw new Error("connection refused");
      },
    },
    {
      s3Client: { getClaim: async () => ({ memberId: "TEST-1" }) },
    },
  );
  await assert.rejects(processor.processClaim("claim.json"), /connection refused/);
});

test("invalid file name is rejected before storage access", async () => {
  let reads = 0;
  const processor = new ClaimsProcessor(null, {
    s3Client: {
      getClaim: async () => {
        reads++;
      },
    },
  });
  await assert.rejects(processor.processClaim(" "), /nonempty/);
  assert.equal(reads, 0);
});

test("ingestion idempotency key is stable for the same object and distinct for different objects", async () => {
  const keys = [];
  const processor = new ClaimsProcessor(
    {
      post: async (_, options) => {
        keys.push(options.headers["Idempotency-Key"]);
        return { status: () => 201, json: async () => ({ claimId: "one" }) };
      },
    },
    {
      s3Client: {
        bucketName: "healthcare-claims-local",
        getClaim: async () => ({ memberId: "TEST-1" }),
      },
    },
  );
  await processor.processClaim("a.json");
  await processor.processClaim("a.json");
  await processor.processClaim("b.json");
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[0], keys[2]);
  assert.match(keys[0], /^[a-f0-9]{64}$/);
});
