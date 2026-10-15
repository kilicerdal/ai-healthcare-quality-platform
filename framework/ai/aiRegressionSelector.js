const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { OllamaClient } = require('./ollamaClient');

class AIRegressionSelector {
  constructor() {
    this.ollama = new OllamaClient();
  }

  getChangedFiles() {
    const output = execFileSync(
      'git',
      ['diff', '--name-only', 'HEAD~1', 'HEAD'],
      { encoding: 'utf8' }
    );

    return output.trim().split('\n').filter(Boolean);
  }

  getAvailableTests() {
    const testDirectory = path.join(process.cwd(), 'tests');

    const walk = (directory) => {
      return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
          const fullPath = path.join(directory, entry.name);

          if (entry.isDirectory()) {
            return walk(fullPath);
          }

          return entry.name.endsWith('.spec.js')
            ? [path.relative(process.cwd(), fullPath)]
            : [];
        });
    };

    return walk(testDirectory).sort();
  }

  getRequiredTests(changedFiles, availableTests) {
  const rules = [
    {
      pattern: /^app\//,
      tests: ['tests/api/', 'tests/contract/', 'tests/smoke/']
    },
    {
      pattern: /^framework\/validators\/aiCoverageValidator\.js$/,
      tests: [
        'tests/ai/aiCoverageValidator.spec.js',
        'tests/ai/aiCoverageNegativeValidation.spec.js',
        'tests/ai/aiCoverageConflictingValidation.spec.js',
        'tests/ai/aiCoverageRuleMismatch.spec.js'
      ]
    },
    {
      pattern: /^framework\/ai\/aiCoverageAnalyzer\.js$/,
      tests: [
        'tests/ai/aiCoverageAnalyzer.spec.js',
        'tests/ai/aiCoveragePipeline.spec.js'
      ]
    },
    {
      pattern: /^framework\/ai\/aiDuplicateCoverageDetector\.js$/,
      tests: [
        'tests/ai/aiDuplicateCoverageDetector.spec.js',
        'tests/ai/aiCoveragePipeline.spec.js'
      ]
    },
    {
      pattern: /^framework\/reporters\/aiExecutionReporter\.js$/,
      tests: ['tests/ai/aiExecutionReporter.spec.js']
    },
    {
      pattern: /^framework\/reporters\/aiExecutionDashboard\.js$/,
      tests: [
        'tests/ai/aiExecutionDashboard.spec.js',
        'tests/ai/aiExecutionMetrics.spec.js'
      ]
    },
    {
      pattern: /^framework\/ai\/aiRegressionSelector\.js$/,
      tests: ['tests/ai/aiRegressionSelector.spec.js']
    },
    {
      pattern: /^database\//,
      tests: ['tests/database/']
    }
  ];

  const selected = new Set();

  for (const file of changedFiles) {
    for (const rule of rules) {
      if (rule.pattern.test(file)) {
        for (const test of availableTests) {
          if (rule.tests.some((prefix) => test.startsWith(prefix))) {
            selected.add(test);
          }
        }
      }
    }

    if (
      file.startsWith('tests/') &&
      file.endsWith('.spec.js') &&
      availableTests.includes(file)
    ) {
      selected.add(file);
    }
  }

  return [...selected].sort();
}

  async selectTests() {
    const changedFiles = this.getChangedFiles();
    const availableTests = this.getAvailableTests();

    const requiredTests = this.getRequiredTests(
      changedFiles,
      availableTests
    );

    console.log('\n===== CHANGED FILES =====');
    console.table(changedFiles);

    console.log('\n===== REQUIRED TESTS =====');
    console.table(requiredTests);

    const prompt = `
You are a senior SDET working on a healthcare API automation framework.

Analyze these changed files:
${JSON.stringify(changedFiles, null, 2)}

Available Playwright tests:
${JSON.stringify(availableTests, null, 2)}

Deterministically required tests:
${JSON.stringify(requiredTests, null, 2)}

Recommend additional relevant regression tests.

Rules:
- Return ONLY valid JSON.
- Do not invent test files.
- Recommend at most 5 additional tests.
- Do not repeat required tests.
- Use this exact format:

{
  "recommendedTests": [
    "tests/example.spec.js"
  ],
  "reason": "Short explanation"
}
`;

    const response = await this.ollama.generate(prompt);

    let aiResult;

    try {
      const cleaned = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      aiResult = JSON.parse(cleaned);
    } catch {
      aiResult = {
        recommendedTests: [],
        reason: 'AI response could not be parsed'
      };
    }

   const aiTests = Array.isArray(aiResult.recommendedTests)
  ? [...new Set(aiResult.recommendedTests)]
      .filter(
        (test) =>
          availableTests.includes(test) &&
          !requiredTests.includes(test)
      )
      .slice(0, 5)
  : [];

    const selectedTests = [
      ...new Set([...requiredTests, ...aiTests])
    ].sort();

    return {
      changedFiles,
      requiredTests,
      aiRecommendedTests: aiTests,
      selectedTests,
      reason: aiResult.reason
    };
  }
}

module.exports = { AIRegressionSelector };