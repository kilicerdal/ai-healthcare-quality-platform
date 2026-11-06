const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loopbackURL, localAWSConfig } = require("../../framework/config/localEndpoints");
test("simulator endpoints accept local alternate ports and reject real cloud destinations", () => {
  assert.equal(loopbackURL("http://127.0.0.1:4311/", "test"), "http://127.0.0.1:4311");
  for (const value of ["https://sqs.us-east-1.amazonaws.com", "http://example.com", "http://user:secret@127.0.0.1", "http://127.0.0.1?host=example.com"]) assert.throws(() => loopbackURL(value, "test"), /loopback/);
});
test("simulator uses explicit synthetic credentials rather than an AWS account chain", () => {
  const config = localAWSConfig();
  assert.equal(config.endpoint, "http://127.0.0.1:5000");
  assert.deepEqual(config.credentials, { accessKeyId: "testing", secretAccessKey: "testing" });
});
