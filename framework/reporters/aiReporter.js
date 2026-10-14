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
        error: result.errors
          .map(error => error.message || String(error))
          .join('\n'),
        status: result.status
      });
    }
  }

  async onEnd() {
    if (this.failures.length === 0) {
      console.log('\nAI Reporter: No test failures to analyze.');
      return;
    }

    const reportDir = path.resolve('reports/ai');
    fs.mkdirSync(reportDir, { recursive: true });

    // AI analysis is optional in CI to avoid depending on local Ollama.
    const aiEnabled =
      process.env.AI_REPORTER_ENABLED === 'true' ||
      (!process.env.CI && process.env.AI_REPORTER_ENABLED !== 'false');

    const ai = aiEnabled ? new OllamaClient() : null;

    for (let i = 0; i < this.failures.length; i++) {
      const failure = this.failures[i];

      const fileName = `failure-${Date.now()}-${i + 1}.txt`;
      const filePath = path.join(reportDir, fileName);

      // Always save the original failure information.
      const baseReport = [
        `TEST: ${failure.title}`,
        `STATUS: ${failure.status}`,
        '',
        'ERROR:',
        failure.error,
        ''
      ].join('\n');

      fs.writeFileSync(filePath, baseReport);

      if (!aiEnabled) {
        console.log(`Failure report saved: reports/ai/${fileName}`);
        continue;
      }

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

        fs.appendFileSync(
          filePath,
          `\nAI ANALYSIS:\n${analysis}\n`
        );

        console.log(`AI analysis saved: reports/ai/${fileName}`);

      } catch (error) {
        fs.appendFileSync(
          filePath,
          `\nAI ANALYSIS UNAVAILABLE:\n${error.message}\n`
        );

        console.warn(
          `AI analysis unavailable for ${failure.title}: ${error.message}`
        );
      }
    }
  }
}

module.exports = AIReporter;