const { spawnSync } = require('child_process');

const {
  AIRegressionSelector
} = require('../framework/ai/aiRegressionSelector');

const CI_SAFE_TESTS = new Set([
  'tests/ai/aiGenerationRetry.spec.js',
  'tests/ai/businessRuleValidation.spec.js',
  'tests/ai/aiCoverageValidator.spec.js',
  'tests/ai/aiCoverageNegativeValidation.spec.js',
  'tests/ai/aiCoverageConflictingValidation.spec.js',
  'tests/ai/aiCoverageRuleMismatch.spec.js',
  'tests/ai/aiDuplicateCoverageDetector.spec.js'
]);

async function main() {
  const selector = new AIRegressionSelector();

  const result = await selector.selectTests();

  const selectedTests = result.selectedTests.filter(
    (test) => CI_SAFE_TESTS.has(test)
  );

  const excludedTests = result.selectedTests.filter(
    (test) => !CI_SAFE_TESTS.has(test)
  );

  console.log('\n===== AI REGRESSION EXECUTION PLAN =====');

  console.log('Total recommended:', result.selectedTests.length);
  console.log('Safe to execute:', selectedTests.length);
  console.log('Excluded (external dependencies or unverified):', excludedTests.length);

  console.table(selectedTests);

  if (excludedTests.length > 0) {
    console.log('\n===== EXCLUDED TESTS =====');
    console.table(excludedTests);
  }

  if (selectedTests.length === 0) {
    console.log('No approved tests selected.');
    return;
  }

  const args = [
    'playwright',
    'test',
    ...selectedTests,
    '--reporter=list',
    '--workers=1'
  ];

  console.log('\nCommand: npx', args.join(' '));

  if (!process.argv.includes('--execute')) {
    console.log('\nDRY RUN ONLY. Add --execute to run the tests.');
    return;
  }

  console.log('\n===== EXECUTING APPROVED TESTS =====');

  const execution = spawnSync('npx', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (execution.error) {
    throw execution.error;
  }

  if (execution.status !== 0) {
    process.exitCode = execution.status || 1;
  }
}

main().catch((error) => {
  console.error('AI regression execution failed:', error.message);
  process.exitCode = 1;
});