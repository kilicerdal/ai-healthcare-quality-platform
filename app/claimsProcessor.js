const { createHash } = require("node:crypto");
const { claimsAPIURL } = require("../framework/config/localEndpoints");
const { S3StorageClient } = require("../framework/clients/s3Client");

class ClaimsProcessor {
  constructor(request, { s3Client } = {}) {
    this.request = request;
    this.s3Client = s3Client || new S3StorageClient();
  }

  async processClaim(fileName) {
    if (typeof fileName !== "string" || !fileName.trim()) {
      throw new Error("Claim file name must be a nonempty string");
    }
    // 1. Retrieve claim from local S3
    const claimData = await this.s3Client.getClaim(fileName);

    // 2. Submit claim to Healthcare Claims API
    const response = await this.request.post(`${claimsAPIURL()}/api/claims`, {
      data: claimData,
      headers: {
        "Idempotency-Key": createHash("sha256")
          .update(JSON.stringify([this.s3Client.bucketName || "healthcare-claims-local", fileName]))
          .digest("hex"),
      },
    });

    if (response.status() !== 201) {
      throw new Error(`Claim processing failed. HTTP status: ${response.status()}`);
    }

    // 3. Return the processed claim
    return await response.json();
  }
}

module.exports = { ClaimsProcessor };
