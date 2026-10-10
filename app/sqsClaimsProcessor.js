const { SQSQueueClient } = require('../framework/clients/sqsClient');
const { ClaimsProcessor } = require('./claimsProcessor');

class SQSClaimsProcessor {

  constructor(request) {
    this.sqsClient = new SQSQueueClient();
    this.claimsProcessor = new ClaimsProcessor(request);
  }

  async processMessages() {

    const messages = await this.sqsClient.receiveMessages();

    const processedClaims = [];

    for (const message of messages) {

      const body = JSON.parse(message.Body);

      // Retrieve claim from S3 and save to PostgreSQL through API
      const claim = await this.claimsProcessor.processClaim(body.key);

      processedClaims.push(claim);

      // Delete SQS message only after successful processing
      await this.sqsClient.deleteMessage(message.ReceiptHandle);
    }

    return processedClaims;
  }
}

module.exports = { SQSClaimsProcessor };