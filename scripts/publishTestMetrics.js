const fs = require('fs');

const files = [
  'test-results/regression.json',
  'test-results/ai-validation.json',
];

const totals = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  flaky: 0,
  duration: 0,
};

let latestStart = '';

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`Missing report: ${file}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  const stats = report.stats;

  totals.passed += stats.expected;
  totals.failed += stats.unexpected;
  totals.skipped += stats.skipped;
  totals.flaky += stats.flaky;
  totals.duration += stats.duration;

  if (stats.startTime > latestStart) {
    latestStart = stats.startTime;
  }
}

totals.total =
  totals.passed + totals.failed + totals.skipped + totals.flaky;

const summary = {
  ...totals,
  updatedAt: latestStart,
  runUrl: process.env.GITHUB_RUN_ID
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : '',
};

fs.mkdirSync('docs', { recursive: true });

fs.writeFileSync(
  'docs/test-metrics.json',
  JSON.stringify(summary, null, 2) + '\n'
);

console.log('Healthcare test metrics:', summary);
