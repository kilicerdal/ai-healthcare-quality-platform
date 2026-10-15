const { AIQualityDashboard } = require(
  '../framework/reporters/aiQualityDashboard'
);

const dashboard = new AIQualityDashboard();

const result = dashboard.generate();
const reportPath = dashboard.save(result);

console.log('\n===== AI HEALTHCARE QUALITY DASHBOARD =====');
console.table(result.metrics);

console.log('\n===== REPORT AVAILABILITY =====');
console.table(result.reportAvailability);

console.log('\nDashboard saved:', reportPath);
