const { RiskEngine } = require('./riskEngine');

class RiskBasedTestSelector {
  constructor() {
    this.engine = new RiskEngine();
  }

  selectTests(changedFiles) {
    const analysis = this.engine.analyze(changedFiles);
    const tags = this.engine.getRecommendedTags(analysis);

    return {
      changedFiles,
      analysis,
      recommendedTags: tags,
      grepPattern: tags.join('|')
    };
  }
}

module.exports = { RiskBasedTestSelector };
