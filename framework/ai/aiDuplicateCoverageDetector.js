class AIDuplicateCoverageDetector {
  constructor() {
    // Known coverage from existing tests
    this.existingCoverage = [
      {
        ruleId: 'missing-required-field',
        condition: 'memberId-missing'
      },
      {
        ruleId: 'invalid-claim-amount',
        condition: 'negative-amount'
      },
      {
        ruleId: 'invalid-claim-amount',
        condition: 'zero-amount'
      },
      {
        ruleId: 'invalid-service-date',
        condition: 'invalid-date'
      }
    ];
  }

  getCondition(scenario) {
    const body = scenario.requestBody || {};

    if (scenario.ruleId === 'missing-required-field') {
      const required = [
        'memberId',
        'providerId',
        'serviceDate',
        'diagnosisCode',
        'claimAmount'
      ];

      const missing = required.find(
        (field) =>
          body[field] === undefined ||
          body[field] === null ||
          body[field] === ''
      );

      return missing ? `${missing}-missing` : 'none';
    }

    if (scenario.ruleId === 'invalid-claim-amount') {
      if (body.claimAmount === 0) return 'zero-amount';

      if (
        typeof body.claimAmount === 'number' &&
        body.claimAmount < 0
      ) {
        return 'negative-amount';
      }

      if (typeof body.claimAmount !== 'number') {
        return 'invalid-amount-type';
      }
    }

    if (scenario.ruleId === 'invalid-service-date') {
      return 'invalid-date';
    }

    return 'unknown';
  }

  check(scenario) {
    const condition = this.getCondition(scenario);

    const duplicate = this.existingCoverage.some(
      (existing) =>
        existing.ruleId === scenario.ruleId &&
        existing.condition === condition
    );

    return {
      duplicate,
      condition,
      reason: duplicate
        ? `Existing test already covers ${condition}`
        : 'No matching existing coverage found'
    };
  }
}

module.exports = { AIDuplicateCoverageDetector };
