import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const TABLE = process.env.TABLE_NAME;
const AUDIO_BUCKET = process.env.AUDIO_BUCKET;

function respond(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
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
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!userId) return respond(401, { error: 'Unauthorized' });
  const PK = `USER#${userId}`;

  const method = event.requestContext?.http?.method;
  const path = event.rawPath || '';
  const segments = path.replace(/^\//, '').split('/');
  const resource = segments[0];
  const id = segments[1];

  if (method === 'GET' && resource === 'audio-upload-url') {
    const jokeId = event.queryStringParameters?.jokeId;
    const mimeType = event.queryStringParameters?.mimeType || 'audio/webm';
    if (!jokeId) return respond(400, { error: 'Missing jokeId' });
    try {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const key = `audio/${userId}/${jokeId}.${ext}`;
      const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
        Bucket: AUDIO_BUCKET, Key: key, ContentType: mimeType,
      }), { expiresIn: 60 });
      const audioUrl = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: AUDIO_BUCKET, Key: key,
      }), { expiresIn: 604800 });
      return respond(200, { uploadUrl, audioUrl });
    } catch (err) {
      console.error(err);
      return respond(500, { error: 'Internal server error' });
    }
  }

  const pfx = prefix(resource);
  if (!pfx) return respond(404, { error: 'Not found' });

  try {
    if (method === 'GET') {
      const result = await client.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': PK, ':sk': `${pfx}#` },
      }));
      const items = (result.Items || []).map(({ PK: _pk, SK: _sk, ...rest }) => rest);
      return respond(200, items);
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.id) return respond(400, { error: 'Missing id' });
      const { PK: _pk, SK: _sk, ...rest } = body;
      const item = { PK, SK: `${pfx}#${body.id}`, ...rest };
      await client.send(new PutCommand({ TableName: TABLE, Item: item }));
      return respond(201, rest);
    }

    if (method === 'PUT') {
      if (!id) return respond(400, { error: 'Missing id' });
      const body = JSON.parse(event.body || '{}');
      const { PK: _pk, SK: _sk, ...rest } = body;
      const item = { PK, SK: `${pfx}#${id}`, ...rest };
      await client.send(new PutCommand({ TableName: TABLE, Item: item }));
      return respond(200, rest);
    }

    if (method === 'DELETE') {
      if (!id) return respond(400, { error: 'Missing id' });
      await client.send(new DeleteCommand({ TableName: TABLE, Key: { PK, SK: `${pfx}#${id}` } }));
      return respond(200, { deleted: id });
    }

    return respond(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return respond(500, { error: 'Internal server error' });
  }
}
