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
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? '';
const DOMAIN = FRONTEND_ORIGIN.replace('https://', '');

const ALLOWED_ORIGINS = new Set([
  FRONTEND_ORIGIN,
  `https://www.${DOMAIN}`,
  'http://localhost:5173',
]);

async function resolveAudioUrls(items) {
  return Promise.all(items.map(async item => {
    if (!item.audio_url?.startsWith('audio/')) return item;
    const audioUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: AUDIO_BUCKET, Key: item.audio_url,
    }), { expiresIn: 3600 });
    return { ...item, audio_url: audioUrl };
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
      return respond(200, await resolveAudioUrls(items), origin);
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.id) return respond(400, { error: 'Missing id' }, origin);
      const { PK: _pk, SK: _sk, ...rest } = body;
      const item = { PK, SK: `${pfx}#${body.id}`, ...rest };
      await client.send(new PutCommand({ TableName: TABLE, Item: item }));
      return respond(201, rest, origin);
    }

    if (method === 'PUT') {
      if (!id) return respond(400, { error: 'Missing id' }, origin);
      const body = JSON.parse(event.body || '{}');
      const { PK: _pk, SK: _sk, ...rest } = body;
      const item = { PK, SK: `${pfx}#${id}`, ...rest };
      await client.send(new PutCommand({ TableName: TABLE, Item: item }));
      const [resolved] = await resolveAudioUrls([rest]);
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
      return respond(200, { deleted: id }, origin);
    }

    return respond(405, { error: 'Method not allowed' }, origin);
  } catch (err) {
    console.error(err);
    return respond(500, { error: 'Internal server error' }, origin);
  }
}
