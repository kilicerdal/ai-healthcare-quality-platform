class ClaimBuilder {
  constructor() {
    this.claim = {
      memberId: 'MEM-1001',
      providerId: 'PRV-2001',
      serviceDate: '2026-10-09',
      diagnosisCode: 'Z00.00',
      claimAmount: 425.50
    };
  }

  withMemberId(memberId) {
    this.claim.memberId = memberId;
    return this;
  }

  withProviderId(providerId) {
    this.claim.providerId = providerId;
    return this;
  }

  withServiceDate(serviceDate) {
    this.claim.serviceDate = serviceDate;
    return this;
  }

  withDiagnosisCode(diagnosisCode) {
    this.claim.diagnosisCode = diagnosisCode;
    return this;
  }

  withClaimAmount(claimAmount) {
    this.claim.claimAmount = claimAmount;
    return this;
  }

  build() {
    return { ...this.claim };
  }
}

module.exports = { ClaimBuilder };