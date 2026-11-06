const {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  ChangeMessageVisibilityCommand,
  CreateQueueCommand,
  DeleteQueueCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

const { localAWSConfig, loopbackURL } = require("../config/localEndpoints");
const sqs = new SQSClient(localAWSConfig());

class SQSQueueClient {
  constructor(queueUrl) {
    this.bucketName = "healthcare-claims-local";
    this.queueUrl = loopbackURL(queueUrl || `${localAWSConfig().endpoint}/123456789012/healthcare-claims-queue`, "Queue URL");
  }

  static async createIsolatedQueue(name) {
    const result = await sqs.send(new CreateQueueCommand({ QueueName: name }));
    return new SQSQueueClient(result.QueueUrl);
  }

  async releaseMessage(receiptHandle) {
    return sqs.send(
      new ChangeMessageVisibilityCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
        VisibilityTimeout: 0,
      }),
    );
  }

  async deleteQueue() {
    return sqs.send(new DeleteQueueCommand({ QueueUrl: this.queueUrl }));
  }

  async sendMessageBody(body) {
    return sqs.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: body,
      }),
    );
  }

  async sendClaimMessage(fileName) {
    return this.sendMessageBody(JSON.stringify({ bucket: this.bucketName, key: fileName }));
  }

  async receiveMessages() {
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 2,
      }),
    );

    return response.Messages || [];
  }

  async deleteMessage(receiptHandle) {
    return sqs.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }
}

module.exports = { SQSQueueClient };
