const fs = require('fs');
const path = require('path');

const { OllamaClient } = require('./ollamaClient');

class AISelfHealing {
  constructor() {
    this.ollama = new OllamaClient();
  }

  async analyzeFailure(failure) {
    if (
      !failure ||
      typeof failure.testName !== 'string' ||
      typeof failure.error !== 'string'
    ) {
      throw new Error('Invalid failure details');
    }

    const prompt = `
You are a senior Playwright automation engineer.

Analyze this failed test:

Test: ${failure.testName}
Error: ${failure.error}

Return ONLY compact JSON:

{
  "rootCause": "Short explanation",
  "suggestedFix": "Short suggested fix",
  "confidence": "HIGH"
}

Rules:
- Do not invent application requirements.
- Do not suggest disabling tests.
- Do not suggest removing assertions.
- Do not suggest changing expected results just to pass.
- Do not suggest modifying production code automatically.
- Confidence must be HIGH, MEDIUM, or LOW.
`;

    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`AI repair analysis attempt ${attempt}/3`);

        const response = await this.ollama.generate(prompt);

        if (typeof response !== 'string') {
          throw new Error('AI response must be text');
        }

        const cleaned = response
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        const result = JSON.parse(cleaned);

        if (
          typeof result.rootCause !== 'string' ||
          !result.rootCause.trim() ||
          typeof result.suggestedFix !== 'string' ||
          !result.suggestedFix.trim() ||
          !['HIGH', 'MEDIUM', 'LOW'].includes(result.confidence)
        ) {
          throw new Error('Invalid AI repair recommendation');
        }

        const unsafePatterns = [
          /disable.{0,30}test/i,
          /skip.{0,30}test/i,
          /remove.{0,30}assertion/i,
          /delete.{0,30}assertion/i,
          /ignore.{0,30}failure/i,
          /change.{0,30}expected.{0,30}pass/i
        ];

        if (unsafePatterns.some((pattern) =>
          pattern.test(result.suggestedFix)
        )) {
          throw new Error('Unsafe repair recommendation');
        }

        return {
          testName: failure.testName,
          error: failure.error,
          rootCause: result.rootCause,
          suggestedFix: result.suggestedFix,
          confidence: result.confidence,
          status: 'REVIEW_REQUIRED',
          automaticallyApplied: false
        };
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed: ${error.message}`);
      }
    }

    throw new Error(
      `AI repair analysis failed: ${lastError.message}`
    );
  }

  saveReport(result) {
    const directory = path.join(
      process.cwd(),
      'reports',
      'ai-self-healing'
    );

    fs.mkdirSync(directory, { recursive: true });

    const filename = `self-healing-${Date.now()}.json`;
    const filepath = path.join(directory, filename);

    fs.writeFileSync(
      filepath,
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        ...result
      }, null, 2)
    );

    return filepath;
  }
}

module.exports = { AISelfHealing };
