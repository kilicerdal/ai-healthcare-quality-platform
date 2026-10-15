const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const {
  AIOpenAPIAnalyzer
} = require('../../framework/ai/aiOpenAPIAnalyzer');

test('@ai Execute validated OpenAPI scenarios', async ({ request }) => {
  test.setTimeout(120000);

  const analyzer = new AIOpenAPIAnalyzer();
  const scenarios = await analyzer.generateScenarios();

  const baseURL = 'http://localhost:3000';

  const results = [];

  const requiredFields = [
    'memberId',
    'providerId',
    'serviceDate',
    'diagnosisCode',
    'claimAmount'
  ];

  for (const scenario of scenarios) {
    const body = scenario.requestBody;

    let approved = false;

    if (
      scenario.method === 'POST' &&
      scenario.endpoint === '/api/claims' &&
      scenario.expectedStatus === 400
    ) {
      const missingMemberId =
        !Object.prototype.hasOwnProperty.call(body, 'memberId');

      const invalidAmount =
        body.claimAmount === 0;

      const otherFieldsPresent = requiredFields
        .filter((field) => field !== 'memberId')
        .every((field) => Object.prototype.hasOwnProperty.call(body, field));

      approved =
        (missingMemberId && otherFieldsPresent) ||
        (invalidAmount && requiredFields.every((field) =>
          Object.prototype.hasOwnProperty.call(body, field)
        ));
    }

    if (
      scenario.method === 'GET' &&
      scenario.endpoint === '/health' &&
      scenario.expectedStatus === 200 &&
      Object.keys(body).length === 0
    ) {
      approved = true;
    }

    if (!approved) {
      results.push({
        name: scenario.name,
        status: 'REJECTED',
        reason: 'Scenario failed deterministic validation'
      });

      continue;
    }

    const url = `${baseURL}${scenario.endpoint}`;

    const response =
      scenario.method === 'POST'
        ? await request.post(url, { data: body })
        : await request.get(url);

    const actualStatus = response.status();

    results.push({
      name: scenario.name,
      method: scenario.method,
      endpoint: scenario.endpoint,
      expectedStatus: scenario.expectedStatus,
      actualStatus,
      status:
        actualStatus === scenario.expectedStatus
          ? 'PASSED'
          : 'FAILED'
    });
  }

  const reportDirectory = path.join(
    process.cwd(),
    'reports',
    'ai-openapi'
  );

  fs.mkdirSync(reportDirectory, { recursive: true });

  const reportPath = path.join(
    reportDirectory,
    `openapi-report-${Date.now()}.json`
  );

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalScenarios: scenarios.length,
        results
      },
      null,
      2
    )
  );

  console.log('\n===== AI OPENAPI EXECUTION REPORT =====');
  console.table(results);
  console.log('Report saved:', reportPath);

  expect(results.filter((result) => result.status === 'REJECTED')).toHaveLength(0);
  expect(results.filter((result) => result.status === 'FAILED')).toHaveLength(0);
  expect(results.filter((result) => result.status === 'PASSED')).toHaveLength(3);
});
