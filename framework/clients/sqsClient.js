const {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand
} = require('@aws-sdk/client-sqs');

const sqs = new SQSClient({
  region: 'us-east-1',
  endpoint: 'http://127.0.0.1:5000',
  credentials: {
    accessKeyId: 'testing',
    secretAccessKey: 'testing'
  }
});

class SQSQueueClient {
  constructor() {
    this.queueUrl = 'http://127.0.0.1:5000/123456789012/healthcare-claims-queue';
  }

  async sendClaimMessage(fileName) {
    return sqs.send(new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({
        bucket: 'healthcare-claims-local',
        key: fileName
      })
    }));
  }

  async receiveMessages() {
    const response = await sqs.send(new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 2
    }));

    return response.Messages || [];
  }

  async deleteMessage(receiptHandle) {
    return sqs.send(new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle
    }));
  }
}

module.exports = { SQSQueueClient };
