const fs = require('fs');
const path = require('path');
const { OllamaClient } = require('../ai/ollamaClient');

class AIReporter {
  constructor() {
    this.failures = [];
  }

  onTestEnd(test, result) {
    if (result.status === 'failed' || result.status === 'timedOut') {
      this.failures.push({
        title: test.titlePath().join(' > '),
        error: result.errors.map(e => e.message || String(e)).join('\n'),
        status: result.status
      });
    }
  }

  async onEnd() {
    if (this.failures.length === 0) {
      console.log('\nAI Reporter: No test failures to analyze.');
      return;
    }

    const ai = new OllamaClient();

    const reportDir = path.resolve('reports/ai');
    fs.mkdirSync(reportDir, { recursive: true });

    for (let i = 0; i < this.failures.length; i++) {
      const failure = this.failures[i];

      try {
        const analysis = await ai.generate(`
You are a Senior SDET investigating a Playwright failure.

Test: ${failure.title}
Status: ${failure.status}
Error: ${failure.error}

Provide:
1. Failure summary
2. Possible root causes
3. Debugging recommendations
4. Suggested fixes

Do not invent evidence or claim a root cause is confirmed.
`);

        const report = `
TEST: ${failure.title}

STATUS: ${failure.status}

ERROR:
${failure.error}

AI ANALYSIS:
${analysis}
`;

        const fileName = `failure-${Date.now()}-${i + 1}.txt`;

        fs.writeFileSync(path.join(reportDir, fileName), report);

        console.log(`AI analysis saved: reports/ai/${fileName}`);

      } catch (error) {
        console.error(`AI analysis failed for ${failure.title}: ${error.message}`);
      }
    }
  }
}

module.exports = AIReporter;
