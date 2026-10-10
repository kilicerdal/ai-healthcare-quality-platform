const { S3StorageClient } = require('../framework/clients/s3Client');

class ClaimsProcessor {
  constructor(request) {
    this.request = request;
    this.s3Client = new S3StorageClient();
  }

  async processClaim(fileName) {
    // 1. Retrieve claim from local S3
    const claimData = await this.s3Client.getClaim(fileName);

    // 2. Submit claim to Healthcare Claims API
    const response = await this.request.post(
      'http://localhost:3000/api/claims',
      {
        data: claimData
      }
    );

    if (response.status() !== 201) {
      throw new Error(
        `Claim processing failed. HTTP status: ${response.status()}`
      );
    }

    // 3. Return the processed claim
    return await response.json();
  }
}

module.exports = { ClaimsProcessor };
