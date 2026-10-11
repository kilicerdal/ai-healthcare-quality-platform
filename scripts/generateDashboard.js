const fs = require('fs');
const path = require('path');

const reportDir = path.join(process.cwd(), 'reports/dashboard');

function readReport(filename) {
  const file = path.join(reportDir, filename);

  if (!fs.existsSync(file)) {
    throw new Error(`Missing report: ${file}`);
  }

  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function summarize(report, name) {
  const stats = report.stats;

  return {
    name,
    passed: stats.expected,
    failed: stats.unexpected,
    skipped: stats.skipped,
    total: stats.expected + stats.unexpected + stats.skipped,
    duration: (stats.duration / 1000).toFixed(2)
  };
}

const regression = summarize(
  readReport('regression-results.json'),
  'Regression'
);

const ai = summarize(
  readReport('ai-results.json'),
  'AI Automation'
);

const total = regression.total + ai.total;
const passed = regression.passed + ai.passed;
const failed = regression.failed + ai.failed;
const passRate = total === 0
  ? 0
  : ((passed / total) * 100).toFixed(1);

const suites = [regression, ai];

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Healthcare Quality Dashboard</title>
<style>
  body {
    margin: 0;
    padding: 40px;
    background: #0f172a;
    color: #e2e8f0;
    font-family: Arial, sans-serif;
  }

  h1 {
    color: #38bdf8;
    margin-bottom: 8px;
  }

  .subtitle {
    color: #94a3b8;
    margin-bottom: 35px;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
    margin-bottom: 35px;
  }

  .card {
    background: #1e293b;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #334155;
  }

  .label {
    color: #94a3b8;
    font-size: 14px;
  }

  .value {
    font-size: 34px;
    font-weight: bold;
    margin-top: 12px;
  }

  .green { color: #4ade80; }
  .red { color: #f87171; }
  .blue { color: #38bdf8; }

  table {
    width: 100%;
    border-collapse: collapse;
    background: #1e293b;
    border-radius: 12px;
    overflow: hidden;
  }

  th, td {
    padding: 16px;
    text-align: left;
    border-bottom: 1px solid #334155;
  }

  th {
    background: #334155;
  }

  .footer {
    margin-top: 35px;
    color: #94a3b8;
    font-size: 13px;
  }
</style>
</head>

<body>

<h1>AI Healthcare Quality Dashboard</h1>
<p class="subtitle">
  Playwright Automation | PostgreSQL | Simulated AWS | Ollama AI
</p>

<div class="cards">
  <div class="card">
    <div class="label">Total Tests</div>
    <div class="value blue">${total}</div>
  </div>

  <div class="card">
    <div class="label">Passed</div>
    <div class="value green">${passed}</div>
  </div>

  <div class="card">
    <div class="label">Failed</div>
    <div class="value ${failed ? 'red' : 'green'}">${failed}</div>
  </div>

  <div class="card">
    <div class="label">Pass Rate</div>
    <div class="value green">${passRate}%</div>
  </div>
</div>

<h2>Test Suite Execution</h2>

<table>
<thead>
<tr>
  <th>Suite</th>
  <th>Total</th>
  <th>Passed</th>
  <th>Failed</th>
  <th>Skipped</th>
  <th>Duration (seconds)</th>
</tr>
</thead>
<tbody>
${suites.map(s => `
<tr>
  <td>${s.name}</td>
  <td>${s.total}</td>
  <td class="green">${s.passed}</td>
  <td class="${s.failed ? 'red' : ''}">${s.failed}</td>
  <td>${s.skipped}</td>
  <td>${s.duration}</td>
</tr>
`).join('')}
</tbody>
</table>

<p class="footer">
Generated: ${new Date().toLocaleString()}<br>
Source: Playwright JSON test reports<br>
Environment: Local development
</p>

</body>
</html>
`;

const output = path.join(reportDir, 'index.html');

fs.writeFileSync(output, html);

console.log('Dashboard generated successfully!');
console.log(`Location: ${output}`);
console.log(`Total: ${total}, Passed: ${passed}, Failed: ${failed}`);
