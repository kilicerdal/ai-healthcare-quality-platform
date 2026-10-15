class AICoverageValidator {
  constructor() {
    this.approvedRules = {
      requiredFields: [
        'memberId',
        'providerId',
        'serviceDate',
        'diagnosisCode',
        'claimAmount'
      ],
      validStatuses: [200, 201, 400, 404]
    };
  }

  validate(scenario) {
    const errors = [];

    if (!scenario || typeof scenario !== 'object') {
      return { valid: false, errors: ['Invalid scenario'] };
    }

    const {
      endpoint,
      method,
      expectedStatus,
      ruleId
    } = scenario;

    const rules = {
      'missing-required-field': {
        endpoint: '/api/claims',
        method: 'POST',
        expectedStatus: 400
      },
      'invalid-claim-amount': {
        endpoint: '/api/claims',
        method: 'POST',
        expectedStatus: 400
      },
      'invalid-service-date': {
        endpoint: '/api/claims',
        method: 'POST',
        expectedStatus: 400
      },
      'claim-not-found': {
        endpoint: '/api/claims/:claimId',
        method: 'GET',
        expectedStatus: 404
      },
      'health-check': {
        endpoint: '/health',
        method: 'GET',
        expectedStatus: 200
      }
    };

    const approvedRule = rules[ruleId];

    if (!approvedRule) {
      errors.push(`Unsupported rule: ${ruleId}`);
    } else {
      if (endpoint !== approvedRule.endpoint) {
        errors.push('Endpoint does not match approved rule');
      }

      if (method !== approvedRule.method) {
        errors.push('HTTP method does not match approved rule');
      }

      if (expectedStatus !== approvedRule.expectedStatus) {
        errors.push('Expected status does not match approved rule');
      }
    }

    // Validate the actual request body for POST scenarios
if (
  approvedRule &&
  method === 'POST' &&
  endpoint === '/api/claims'
) {
  const body = scenario.requestBody;

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    errors.push('Missing or invalid requestBody');
  } else {
    const requiredFields = this.approvedRules.requiredFields;

    const missingFields = requiredFields.filter(
      (field) =>
        body[field] === undefined ||
        body[field] === null ||
        body[field] === ''
    );
    // Detect conflicting validation failures
const invalidAmount =
  typeof body.claimAmount !== 'number' ||
  !Number.isFinite(body.claimAmount) ||
  body.claimAmount <= 0;

const date = body.serviceDate;

const validFormat =
  typeof date === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(date);

let validDate = false;

if (validFormat) {
  const parsedDate = new Date(`${date}T00:00:00Z`);

  validDate =
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date;
}

const invalidDate = !validDate;

// Identify independent validation failures
const failureCategories = [];

if (missingFields.length > 0) {
  failureCategories.push('missing-required-field');
}

if (
  body.claimAmount !== undefined &&
  body.claimAmount !== null &&
  body.claimAmount !== '' &&
  invalidAmount
) {
  failureCategories.push('invalid-claim-amount');
}

if (
  body.serviceDate !== undefined &&
  body.serviceDate !== null &&
  body.serviceDate !== '' &&
  invalidDate
) {
  failureCategories.push('invalid-service-date');
}

if (failureCategories.length > 1) {
  errors.push(
    `Conflicting validation failures: ${failureCategories.join(', ')}`
  );
}
// Ensure the actual failure matches the claimed rule
if (
  failureCategories.length === 1 &&
  failureCategories[0] !== ruleId
) {
  errors.push(
    `Rule mismatch: expected ${ruleId}, but requestBody violates ${failureCategories[0]}`
  );
}


    if (ruleId === 'missing-required-field') {
      if (missingFields.length === 0) {
        errors.push(
          'Scenario does not contain a missing required field'
        );
      }
    }

    if (ruleId === 'invalid-claim-amount') {
      if (
        typeof body.claimAmount === 'number' &&
        Number.isFinite(body.claimAmount) &&
        body.claimAmount > 0
      ) {
        errors.push('claimAmount is valid');
      }
    }

    if (ruleId === 'invalid-service-date') {
      const date = body.serviceDate;

      const validFormat =
        typeof date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(date);

      let validDate = false;

      if (validFormat) {
        const parsedDate = new Date(`${date}T00:00:00Z`);

        validDate =
          !Number.isNaN(parsedDate.getTime()) &&
          parsedDate.toISOString().slice(0, 10) === date;
      }

      if (validDate) {
        errors.push('serviceDate is valid');
      }
    }
  }
}
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = { AICoverageValidator };