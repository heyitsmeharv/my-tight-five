import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
const TABLE = process.env.TABLE_NAME;
const AUDIO_BUCKET = process.env.AUDIO_BUCKET;
const VIDEO_BUCKET = process.env.VIDEO_BUCKET;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? '';
const DOMAIN = FRONTEND_ORIGIN.replace('https://', '');

const ALLOWED_ORIGINS = new Set([
  FRONTEND_ORIGIN,
  `https://www.${DOMAIN}`,
  'http://localhost:5173',
]);

async function resolveAudioUrls(items) {
  return Promise.all(items.map(async item => {
    if (!item.audio_url) return item;
    let key = item.audio_url;
    if (key.startsWith('https://')) {
      key = new URL(key).pathname.slice(1);
    }
    if (!key.startsWith('audio/')) return item;
    const audioUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: AUDIO_BUCKET, Key: key,
    }), { expiresIn: 86400 });
    return { ...item, audio_url: audioUrl };
  }));
}

async function resolveVideoUrls(items) {
  return Promise.all(items.map(async item => {
    if (!item.video_url) return item;
    let key = item.video_url;
    if (key.startsWith('https://')) {
      key = new URL(key).pathname.slice(1);
    }
    if (!key.startsWith('video/')) return item;
    const videoUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: VIDEO_BUCKET, Key: key,
    }), { expiresIn: 43200 });
    return { ...item, video_url: videoUrl };
  }));
}

function respond(statusCode, body, origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : FRONTEND_ORIGIN;
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowOrigin,
    },
    body: JSON.stringify(body),
  };
}

function prefix(resource) {
  const map = {
    ideas: 'IDEA',
    jokes: 'JOKE',
    sets: 'SET',
    videos: 'VIDEO',
  };
  return map[resource];
}

export async function handler(event) {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) return respond(401, { error: 'Unauthorized' });

  const origin = event.headers?.origin || '';
  const PK = `USER#${userId}`;
  const method = event.httpMethod;
  const path = event.path || '';
  const segments = path.replace(/^\//, '').split('/');
  const resource = segments[0];
  const id = segments[1];

  if (method === 'DELETE' && resource === 'audio') {
    const jokeId = event.queryStringParameters?.jokeId;
    if (!jokeId) return respond(400, { error: 'Missing jokeId' }, origin);
    if (!/^[\w-]{1,128}$/.test(jokeId)) return respond(400, { error: 'Invalid jokeId' }, origin);
    await Promise.allSettled([
      s3.send(new DeleteObjectCommand({ Bucket: AUDIO_BUCKET, Key: `audio/${userId}/${jokeId}.webm` })),
      s3.send(new DeleteObjectCommand({ Bucket: AUDIO_BUCKET, Key: `audio/${userId}/${jokeId}.mp4` })),
    ]);
    return respond(200, { deleted: jokeId }, origin);
  }

  if (method === 'GET' && resource === 'audio-upload-url') {
    const jokeId = event.queryStringParameters?.jokeId;
    const mimeType = event.queryStringParameters?.mimeType || 'audio/webm';
    if (!jokeId) return respond(400, { error: 'Missing jokeId' }, origin);
    if (!/^[\w-]{1,128}$/.test(jokeId)) return respond(400, { error: 'Invalid jokeId' }, origin);
    try {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const key = `audio/${userId}/${jokeId}.${ext}`;
      const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
        Bucket: AUDIO_BUCKET, Key: key, ContentType: mimeType,
      }), { expiresIn: 60 });
      return respond(200, { uploadUrl, audioUrl: key }, origin);
    } catch (err) {
      console.error(err);
      return respond(500, { error: 'Internal server error' }, origin);
    }
  }

  if (method === 'GET' && resource === 'video-upload-url') {
    const videoId = event.queryStringParameters?.videoId;
    const mimeType = event.queryStringParameters?.mimeType || 'video/mp4';
    if (!videoId) return respond(400, { error: 'Missing videoId' }, origin);
    if (!/^[\w-]{1,128}$/.test(videoId)) return respond(400, { error: 'Invalid videoId' }, origin);
    try {
      const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mov') ? 'mov' : 'mp4';
      const key = `video/${userId}/${videoId}.${ext}`;
      const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
        Bucket: VIDEO_BUCKET, Key: key, ContentType: mimeType,
      }), { expiresIn: 300 });
      return respond(200, { uploadUrl, videoUrl: key }, origin);
    } catch (err) {
      console.error(err);
      return respond(500, { error: 'Internal server error' }, origin);
    }
  }

  if (method === 'DELETE' && resource === 'video') {
    const videoId = event.queryStringParameters?.videoId;
    if (!videoId) return respond(400, { error: 'Missing videoId' }, origin);
    if (!/^[\w-]{1,128}$/.test(videoId)) return respond(400, { error: 'Invalid videoId' }, origin);
    await Promise.allSettled([
      s3.send(new DeleteObjectCommand({ Bucket: VIDEO_BUCKET, Key: `video/${userId}/${videoId}.mp4` })),
      s3.send(new DeleteObjectCommand({ Bucket: VIDEO_BUCKET, Key: `video/${userId}/${videoId}.webm` })),
      s3.send(new DeleteObjectCommand({ Bucket: VIDEO_BUCKET, Key: `video/${userId}/${videoId}.mov` })),
    ]);
    return respond(200, { deleted: videoId }, origin);
  }

  const pfx = prefix(resource);
  if (!pfx) return respond(404, { error: 'Not found' }, origin);

  try {
    if (method === 'GET') {
      const result = await client.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': PK, ':sk': `${pfx}#` },
      }));
      const items = (result.Items || []).map(({ PK: _pk, SK: _sk, ...rest }) => rest);
      if (resource === 'videos') return respond(200, await resolveVideoUrls(items), origin);
      return respond(200, await resolveAudioUrls(items), origin);
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.id) return respond(400, { error: 'Missing id' }, origin);
      if (!/^[\w-]{1,128}$/.test(body.id)) return respond(400, { error: 'Invalid id' }, origin);
      const { PK: _pk, SK: _sk, ...rest } = body;
      const item = { PK, SK: `${pfx}#${body.id}`, ...rest };
      await client.send(new PutCommand({
        TableName: TABLE,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)',
      }));
      return respond(201, rest, origin);
    }

    if (method === 'PUT') {
      if (!id) return respond(400, { error: 'Missing id' }, origin);
      if (!/^[\w-]{1,128}$/.test(id)) return respond(400, { error: 'Invalid id' }, origin);
      const body = JSON.parse(event.body || '{}');
      const { PK: _pk, SK: _sk, ...rest } = body;
      const item = { PK, SK: `${pfx}#${id}`, ...rest };
      await client.send(new PutCommand({ TableName: TABLE, Item: item }));
      const resolver = resource === 'videos' ? resolveVideoUrls : resolveAudioUrls;
      const [resolved] = await resolver([rest]);
      return respond(200, resolved, origin);
    }

    if (method === 'DELETE') {
      if (!id) return respond(400, { error: 'Missing id' }, origin);
      await client.send(new DeleteCommand({ TableName: TABLE, Key: { PK, SK: `${pfx}#${id}` } }));
      if (resource === 'jokes' || resource === 'sets') {
        await Promise.allSettled([
          s3.send(new DeleteObjectCommand({ Bucket: AUDIO_BUCKET, Key: `audio/${userId}/${id}.webm` })),
          s3.send(new DeleteObjectCommand({ Bucket: AUDIO_BUCKET, Key: `audio/${userId}/${id}.mp4` })),
        ]);
      }
      if (resource === 'videos') {
        await Promise.allSettled([
          s3.send(new DeleteObjectCommand({ Bucket: VIDEO_BUCKET, Key: `video/${userId}/${id}.mp4` })),
          s3.send(new DeleteObjectCommand({ Bucket: VIDEO_BUCKET, Key: `video/${userId}/${id}.webm` })),
          s3.send(new DeleteObjectCommand({ Bucket: VIDEO_BUCKET, Key: `video/${userId}/${id}.mov` })),
        ]);
      }
      return respond(200, { deleted: id }, origin);
    }

    return respond(405, { error: 'Method not allowed' }, origin);
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return respond(409, { error: 'Already exists' }, origin);
    console.error(err);
    return respond(500, { error: 'Internal server error' }, origin);
  }
}
