const fs = require('fs');
const path = require('path');

const reportDir = path.join(process.cwd(), 'reports/dashboard');

function extractTests(suites, suiteName) {
  const results = [];

  function visit(suite) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const attempts = test.results || [];
        const latest = attempts[attempts.length - 1];

        results.push({
          suite: suiteName,
          name: spec.title,
          file: spec.file || suite.file || '',
          status: test.status || 'unknown',
          duration: attempts.reduce(
            (sum, result) => sum + (result.duration || 0),
            0
          ),
          error: latest?.error?.message || ''
        });
      }
    }

    for (const child of suite.suites || []) {
      visit(child);
    }
  }

  for (const suite of suites || []) {
    visit(suite);
  }

  return results;
}

const regression = JSON.parse(
  fs.readFileSync(path.join(reportDir, 'regression-results.json'), 'utf8')
);

const ai = JSON.parse(
  fs.readFileSync(path.join(reportDir, 'ai-results.json'), 'utf8')
);

const tests = [
  ...extractTests(regression.suites, 'Regression'),
  ...extractTests(ai.suites, 'AI Automation')
];

const output = path.join(reportDir, 'test-details.json');

fs.writeFileSync(output, JSON.stringify(tests, null, 2));

console.log(`Extracted ${tests.length} test records`);
console.log(`Saved: ${output}`);
