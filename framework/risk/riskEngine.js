class RiskEngine {
  constructor() {
    this.rules = [
      {
        component: 'claims-api',
        paths: ['app/server.js', 'framework/clients/claimsClient.js'],
        tags: ['@api', '@database', '@e2e'],
        risk: 'HIGH',
        reason: 'Claims API changes can affect claim creation, retrieval, and persistence.'
      },
      {
        component: 'database',
        paths: ['app/db.js', 'framework/clients/databaseClient.js'],
        tags: ['@database', '@e2e'],
        risk: 'HIGH',
        reason: 'Database changes can affect claim persistence and data integrity.'
      },
      {
        component: 's3-ingestion',
        paths: ['framework/clients/s3Client.js', 'app/claimsProcessor.js'],
        tags: ['@s3', '@e2e'],
        risk: 'HIGH',
        reason: 'S3 ingestion changes can interrupt claim processing.'
      },
      {
        component: 'sqs-processing',
        paths: ['framework/clients/sqsClient.js', 'app/sqsClaimsProcessor.js'],
        tags: ['@sqs', '@e2e'],
        risk: 'HIGH',
        reason: 'Queue processing changes can affect event-driven claim ingestion.'
      },
      {
        component: 'ai-automation',
        paths: ['framework/ai/', 'framework/reporters/'],
        tags: ['@ai'],
        risk: 'MEDIUM',
        reason: 'AI changes can affect test generation and failure analysis.'
      }
    ];
  }

  analyze(changedFiles) {
    return this.rules
      .filter(rule =>
        changedFiles.some(file =>
          rule.paths.some(path => file.startsWith(path))
        )
      )
      .map(rule => ({
        component: rule.component,
        risk: rule.risk,
        tags: rule.tags,
        reason: rule.reason
      }));
  }

  getRecommendedTags(results) {
    return [...new Set(results.flatMap(result => result.tags))];
  }
}

module.exports = { RiskEngine };
