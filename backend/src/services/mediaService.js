const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const BUCKET = process.env.AWS_S3_BUCKET || 'civicpulse-media';
const CDN_BASE = process.env.CDN_BASE_URL || `https://${BUCKET}.s3.ap-south-1.amazonaws.com`;

let s3Client;
function getS3Client() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    const err = new Error('AWS S3 media upload is not configured');
    err.code = 'S3_NOT_CONFIGURED';
    err.status = 503;
    throw err;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  return s3Client;
}

async function uploadMedia(file, issueId) {
  const ext = file.originalname.split('.').pop() || 'bin';
  const key = `issues/${issueId}/${uuidv4()}.${ext}`;

  await getS3Client().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  }));

  const mediaType = file.mimetype.startsWith('video/') ? 'VIDEO'
    : file.mimetype.startsWith('audio/') ? 'AUDIO' : 'IMAGE';

  return {
    issue_id: issueId,
    media_type: mediaType,
    s3_url: `s3://${BUCKET}/${key}`,
    cdn_url: `${CDN_BASE}/${key}`,
    file_size: file.size
  };
}

module.exports = { uploadMedia };
