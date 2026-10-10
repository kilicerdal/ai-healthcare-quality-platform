class ClaimsClient {
  constructor(request) {
    this.request = request;
    this.baseUrl = 'http://localhost:3000';
  }

  async createClaim(claimData) {
    return await this.request.post(
      `${this.baseUrl}/api/claims`,
      {
        data: claimData
      }
    );
  }

  async getClaim(claimId) {
  return await this.request.get(
    `${this.baseUrl}/api/claims/${claimId}`
  );
}
  async healthCheck() {
    return await this.request.get(
      `${this.baseUrl}/health`
    );
  }
}

module.exports = { ClaimsClient };