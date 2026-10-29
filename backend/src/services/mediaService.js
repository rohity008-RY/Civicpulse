const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
let storageReady;

async function ensureStorageBucket() {
  if (!storageReady) storageReady = (async () => {
    const bucket = process.env.SUPABASE_MEDIA_BUCKET || 'civicpulse-media';
    const { data, error } = await supabase.storage.getBucket(bucket);
    if (data) return bucket;
    if (error && !/not found|does not exist/i.test(error.message)) throw error;
    const { error: createError } = await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 52428800 });
    if (createError && !/already exists|duplicate/i.test(createError.message)) throw createError;
    return bucket;
  })().catch(error => { storageReady = null; throw error; });
  return storageReady;
}

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
  if (!/^(image\/(jpeg|png|webp|gif|heic|heif)|video\/(mp4|webm|quicktime)|audio\/(webm|mpeg|mp4|wav|ogg))$/.test(file.mimetype)) {
    throw Object.assign(new Error('Unsupported media format'), { status: 400 });
  }
  const ext = (file.originalname.split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'bin';
  const key = `issues/${issueId}/${uuidv4()}.${ext}`;

  const mediaType = file.mimetype.startsWith('video/') ? 'VIDEO'
    : file.mimetype.startsWith('audio/') ? 'AUDIO' : 'IMAGE';
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    const bucket = await ensureStorageBucket();
    const { error } = await supabase.storage.from(bucket).upload(key, file.buffer, { contentType: file.mimetype, cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return { issue_id: issueId, media_type: mediaType, s3_url: data.publicUrl, cdn_url: data.publicUrl, file_size: file.size };
  }

  await getS3Client().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  }));

  return {
    issue_id: issueId,
    media_type: mediaType,
    s3_url: `s3://${BUCKET}/${key}`,
    cdn_url: `${CDN_BASE}/${key}`,
    file_size: file.size
  };
}

module.exports = { uploadMedia };
