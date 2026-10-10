const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command
} = require('@aws-sdk/client-s3');

// Local AWS emulator configuration
const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://127.0.0.1:5000',
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'testing',
    secretAccessKey: 'testing'
  }
});

class S3StorageClient {

  constructor() {
    this.bucketName = 'healthcare-claims-local';
  }

  // Upload healthcare claim JSON
  async uploadClaim(fileName, claimData) {

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: JSON.stringify(claimData),
      ContentType: 'application/json'
    });

    return await s3.send(command);
  }

  // Retrieve healthcare claim JSON
  async getClaim(fileName) {

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileName
    });

    const response = await s3.send(command);

    const body = await response.Body.transformToString();

    return JSON.parse(body);
  }

  // List uploaded files
  async listClaims() {

    const command = new ListObjectsV2Command({
      Bucket: this.bucketName
    });

    const response = await s3.send(command);

    return response.Contents || [];
  }
}

module.exports = { S3StorageClient };