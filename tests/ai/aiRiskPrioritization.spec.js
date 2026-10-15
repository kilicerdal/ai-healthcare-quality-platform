const { test, expect } = require('@playwright/test');

const {
  AIRiskPrioritizer
} = require('../../framework/ai/aiRiskPrioritizer');

test('@ai Prioritize healthcare API regression tests by risk', async () => {
  test.setTimeout(120000);

  const prioritizer = new AIRiskPrioritizer();

  const priorities = await prioritizer.prioritize();
  const reportPath = prioritizer.saveReport(priorities);

  console.log('\n===== AI RISK PRIORITIZATION =====');
  console.table(
    priorities.map(p => ({
      id: p.id,
      name: p.name,
      criticality: p.criticality,
      aiScore: p.aiRiskScore,
      finalScore: p.finalRiskScore
    }))
  );

  console.log('Report saved:', reportPath);

  expect(priorities).toHaveLength(5);

  for (let i = 1; i < priorities.length; i++) {
    expect(priorities[i - 1].finalRiskScore)
      .toBeGreaterThanOrEqual(priorities[i].finalRiskScore);
  }

  for (const priority of priorities) {
    if (priority.criticality === 'HIGH') {
      expect(priority.finalRiskScore).toBeGreaterThanOrEqual(8);
    }
  }
});
