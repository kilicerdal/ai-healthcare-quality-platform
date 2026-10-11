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

const detailsFile = path.join(reportDir, 'test-details.json');

if (!fs.existsSync(detailsFile)) {
  throw new Error(
    'Missing test-details.json. Run node scripts/extractTestDetails.js first.'
  );
}

const testDetails = JSON.parse(fs.readFileSync(detailsFile, 'utf8'));

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function displayStatus(status) {
  if (status === 'expected') return 'PASSED';
  if (status === 'unexpected') return 'FAILED';
  if (status === 'skipped') return 'SKIPPED';
  if (status === 'flaky') return 'FLAKY';
  return String(status).toUpperCase();
}



const auditFile = path.join(reportDir, 'ai-audit-results.json');

const auditReport = fs.existsSync(auditFile)
  ? JSON.parse(fs.readFileSync(auditFile, 'utf8'))
  : null;

const auditSection = auditReport
  ? `
<h2>AI Scenario Audit</h2>

<p class="subtitle">
  Source: ${escapeHtml(auditReport.source)}
  — ${escapeHtml(auditReport.description)}
</p>

<div class="cards">
  <div class="card">
    <div class="label">Scenarios Audited</div>
    <div class="value blue">${auditReport.totalAudited}</div>
  </div>

  <div class="card">
    <div class="label">Matching Expectations</div>
    <div class="value green">${auditReport.matched}</div>
  </div>

  <div class="card">
    <div class="label">Incorrect Expectations Detected</div>
    <div class="value red">${auditReport.mismatched}</div>
  </div>
</div>

<table>
<thead>
<tr>
  <th>Scenario</th>
  <th>Provided HTTP Status</th>
  <th>Rule-Based HTTP Status</th>
  <th>Finding</th>
</tr>
</thead>
<tbody>
${auditReport.findings.map(f => `
<tr>
  <td>${escapeHtml(f.name)}</td>
  <td>${escapeHtml(f.aiExpectedStatus)}</td>
  <td>${escapeHtml(f.expectedStatus)}</td>
  <td class="${f.hallucinationDetected ? 'red' : 'green'}">
    ${escapeHtml(f.reason)}
  </td>
</tr>
`).join('')}
</tbody>
</table>

<p class="subtitle">
  These metrics describe the recorded audit sample.
  They do not measure the accuracy of the live AI model.
</p>
`
  : `
<h2>AI Scenario Audit</h2>
<p class="subtitle">
  No audit report available. Run the scenario auditor test to generate one.
</p>
`;


const liveAuditFile = path.join(reportDir, 'live-ai-audit-results.json');

const liveAudit = fs.existsSync(liveAuditFile)
  ? JSON.parse(fs.readFileSync(liveAuditFile, 'utf8'))
  : null;

const liveAuditSection = liveAudit
  ? `
<h2>Live Ollama Scenario Audit</h2>

<p class="subtitle">
  Source: ${escapeHtml(liveAudit.source)}
  — Accepted AI-generated scenarios after generator validation.
</p>

<div class="cards">
  <div class="card">
    <div class="label">Live Scenarios Audited</div>
    <div class="value blue">${liveAudit.totalAudited}</div>
  </div>

  <div class="card">
    <div class="label">Matching Expectations</div>
    <div class="value green">${liveAudit.matched}</div>
  </div>

  <div class="card">
    <div class="label">Incorrect Expectations</div>
    <div class="value red">${liveAudit.mismatched}</div>
  </div>
</div>

<table>
<thead>
<tr>
  <th>AI-Generated Scenario</th>
  <th>AI Expected Status</th>
  <th>Rule-Based Status</th>
  <th>Audit Result</th>
</tr>
</thead>
<tbody>
${liveAudit.findings.map(f => `
<tr>
  <td>${escapeHtml(f.name)}</td>
  <td>${escapeHtml(f.aiExpectedStatus)}</td>
  <td>${escapeHtml(f.expectedStatus)}</td>
  <td class="${f.hallucinationDetected ? 'red' : 'green'}">
    ${f.hallucinationDetected ? 'MISMATCH' : 'MATCH'}
  </td>
</tr>
`).join('')}
</tbody>
</table>

<p class="subtitle">
  Results reflect validated Ollama output, not raw model accuracy.
  Generated: ${escapeHtml(liveAudit.generatedAt)}
</p>
`
  : `
<h2>Live Ollama Scenario Audit</h2>
<p class="subtitle">
  No live audit report available.
  Run the live scenario auditor test to generate one.
</p>
`;


const generationFile = path.join(
  reportDir,
  'ai-generation-results.json'
);

const generationReport = fs.existsSync(generationFile)
  ? JSON.parse(fs.readFileSync(generationFile, 'utf8'))
  : null;

const generationSection = generationReport
  ? `
<h2>AI Generation Reliability</h2>

<p class="subtitle">
  Model: ${escapeHtml(generationReport.model)}
  — Latest recorded generation session.
</p>

<div class="cards">
  <div class="card">
    <div class="label">Generation Attempts</div>
    <div class="value blue">${generationReport.attempts.length}</div>
  </div>

  <div class="card">
    <div class="label">Accepted Attempts</div>
    <div class="value green">
      ${generationReport.attempts.filter(a => a.accepted).length}
    </div>
  </div>

  <div class="card">
    <div class="label">Rejected Attempts</div>
    <div class="value red">
      ${generationReport.attempts.filter(a => !a.accepted).length}
    </div>
  </div>
</div>

<table>
<thead>
<tr>
  <th>Attempt</th>
  <th>Result</th>
  <th>Validation Details</th>
</tr>
</thead>
<tbody>
${generationReport.attempts.map(a => `
<tr>
  <td>${escapeHtml(a.attempt)}</td>
  <td class="${a.accepted ? 'green' : 'red'}">
    ${a.accepted ? 'ACCEPTED' : 'REJECTED'}
  </td>
  <td>${escapeHtml(a.reason)}</td>
</tr>
`).join('')}
</tbody>
</table>

<p class="subtitle">
  Generated: ${escapeHtml(generationReport.generatedAt)}
</p>
`
  : `
<h2>AI Generation Reliability</h2>
<p class="subtitle">
  No generation report available.
</p>
`;

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


<h2>Quality Overview</h2>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:35px;">

  <div class="card">
    <h3>Overall Test Results</h3>

    <div style="
      width:180px;
      height:180px;
      border-radius:50%;
      margin:25px auto;
      background:conic-gradient(
        #4ade80 0% ${total ? passed / total * 100 : 0}%,
        #f87171 ${total ? passed / total * 100 : 0}% ${total ? (passed + failed) / total * 100 : 0}%,
        #facc15 ${total ? (passed + failed) / total * 100 : 0}% 100%
      );
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        background:#1e293b;
        width:125px;
        height:125px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:24px;
        font-weight:bold;
      ">
        ${passRate}%
      </div>
    </div>

    <p style="text-align:center">
      <span class="green">● Passed: ${passed}</span> |
      <span class="red">● Failed: ${failed}</span>
    </p>
  </div>

  <div class="card">
    <h3>Test Suite Comparison</h3>

    ${suites.map(s => `
      <p>${s.name}: ${s.passed}/${s.total} passed</p>

      <div style="
        background:#334155;
        height:25px;
        border-radius:6px;
        overflow:hidden;
        margin-bottom:20px;
      ">
        <div style="
          background:#4ade80;
          width:${s.total ? s.passed / s.total * 100 : 0}%;
          height:100%;
        "></div>
      </div>
    `).join('')}
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


${auditSection}
${liveAuditSection}
${generationSection}
<h2>Individual Test Results</h2>

<input
  type="text"
  id="testSearch"
  placeholder="Search tests by name, suite, or status..."
  onkeyup="filterTests()"
  style="width:100%;padding:14px;margin-bottom:20px;background:#1e293b;color:white;border:1px solid #475569;border-radius:8px;box-sizing:border-box;"
>

<table id="testTable">
<thead>
<tr>
  <th>Test Name</th>
  <th>Suite</th>
  <th>Status</th>
  <th>Duration</th>
  <th>Failure Details</th>
</tr>
</thead>
<tbody>
${testDetails.map(t => `
<tr>
  <td>${escapeHtml(t.name)}</td>
  <td>${escapeHtml(t.suite)}</td>
  <td class="${t.status === 'expected' ? 'green' : 'red'}">
    ${escapeHtml(displayStatus(t.status))}
  </td>
  <td>${Number(t.duration || 0)} ms</td>
  <td>
    ${t.error
      ? `<details>
           <summary>View failure</summary>
           <pre style="white-space:pre-wrap;overflow-wrap:anywhere;">${escapeHtml(t.error)}</pre>
         </details>`
      : '—'}
  </td>
</tr>
`).join('')}
</tbody>
</table>

<script>
function filterTests() {
  const input = document.getElementById('testSearch');
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll('#testTable tbody tr');

  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(filter)
      ? ''
      : 'none';
  });
}
</script>

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
