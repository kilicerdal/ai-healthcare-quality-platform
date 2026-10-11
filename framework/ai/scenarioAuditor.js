class ScenarioAuditor {
  audit(scenarios) {
    return scenarios.map((scenario) => {
      const data = scenario.testData || scenario;

      const requiredFields = [
        'memberId',
        'providerId',
        'serviceDate',
        'diagnosisCode',
        'claimAmount'
      ];

      const missingFields = requiredFields.filter(
        (field) => data[field] === undefined ||
                   data[field] === null ||
                   data[field] === ''
      );

      const validAmount =
        typeof data.claimAmount === 'number' &&
        Number.isFinite(data.claimAmount) &&
        data.claimAmount > 0;

      const validDate =
        typeof data.serviceDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(data.serviceDate) &&
        !Number.isNaN(Date.parse(data.serviceDate)) &&
        new Date(data.serviceDate).toISOString().slice(0, 10) ===
          data.serviceDate;

      const expectedStatus =
        missingFields.length === 0 && validAmount && validDate
          ? 201
          : 400;

      const aiExpectedStatus = scenario.expectedStatus;

      return {
        name: scenario.name || scenario.scenarioDescription || 'Unnamed scenario',
        aiExpectedStatus,
        expectedStatus,
        hallucinationDetected:
          aiExpectedStatus !== expectedStatus,
        reason:
          aiExpectedStatus !== expectedStatus
            ? 'AI expectation conflicts with deterministic API rules'
            : 'AI expectation matches API rules'
      };
    });
  }
}

module.exports = { ScenarioAuditor };
