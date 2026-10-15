const { test, expect } = require('@playwright/test');

const {
  AITestDataGenerator
} = require('../../framework/ai/aiTestDataGenerator');

test('@ai Generate and validate fictional healthcare claims', async () => {
  test.setTimeout(120000);

  const generator = new AITestDataGenerator();

  const claims = await generator.generate();
  const reportPath = generator.saveReport(claims);

  console.log('\n===== AI GENERATED HEALTHCARE TEST DATA =====');
  console.table(claims);
  console.log('Report saved:', reportPath);

  expect(claims).toHaveLength(3);

  for (const claim of claims) {
    expect(generator.validateClaim(claim)).toBe(true);
    expect(claim.memberId).toMatch(/^TEST-/);
    expect(claim.providerId).toMatch(/^TEST-/);
  }
});
