// S3Service.js

const {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

class S3Service {

  constructor({ bucket, region, accessKey, secretKey, endpoint }) {

    this.bucket = bucket;
    this.endpoint = endpoint;

    this.s3 = new S3Client({
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey
      },
      forcePathStyle: true
    });

  }

  async testConnection() {
    try {

      await this.s3.send(new HeadBucketCommand({
        Bucket: this.bucket
      }));

      return true;

    } catch (err) {

      console.error("S3 connection failed:", err.message);
      return false;

    }
  }

  async uploadFile(file) {

    const key = `${Date.now()}-${file.originalname}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    const presignedUrl = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      }),
      { expiresIn: 3600 }
    );

    return {
      key,
      presignedUrl
    };
  }

  async uploadPublicFile(file, folder = "") {

    const key = folder
      ? `${folder}/${file.originalname}`
      : file.originalname;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read"
    }));

    const url = `${this.endpoint}/${this.bucket}/${key}`;

    return {
      key,
      url
    };
  }
}

module.exports = S3Service;
