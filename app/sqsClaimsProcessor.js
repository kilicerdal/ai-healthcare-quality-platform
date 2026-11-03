const { SQSQueueClient } = require("../framework/clients/sqsClient");
const { ClaimsProcessor } = require("./claimsProcessor");

class SQSClaimsProcessor {
  constructor(request, { sqsClient, claimsProcessor } = {}) {
    this.sqsClient = sqsClient || new SQSQueueClient();
    this.claimsProcessor = claimsProcessor || new ClaimsProcessor(request);
  }

  async processMessages() {
    const messages = await this.sqsClient.receiveMessages();
    const processedClaims = [];
    const failures = [];

    for (const message of messages) {
      try {
        if (!message.ReceiptHandle) throw new Error("Message has no receipt handle");
        const body = JSON.parse(message.Body);
        if (
          !body ||
          typeof body !== "object" ||
          Array.isArray(body) ||
          typeof body.key !== "string" ||
          !body.key.trim()
        ) {
          throw new Error("Message must contain a nonempty S3 key");
        }
        if (body.bucket !== this.sqsClient.bucketName) {
          throw new Error("Message bucket does not match the configured claims bucket");
        }
        const claim = await this.claimsProcessor.processClaim(body.key);
        // Failed processing remains unacknowledged for retry or dead-letter handling.
        await this.sqsClient.deleteMessage(message.ReceiptHandle);
        processedClaims.push(claim);
      } catch (cause) {
        failures.push(new Error("Queue message processing failed", { cause }));
      }
    }

    if (failures.length) {
      const error = new AggregateError(failures, `${failures.length} queue message(s) failed`);
      error.processedClaims = processedClaims;
      throw error;
    }
    return processedClaims;
  }
}

module.exports = { SQSClaimsProcessor };
