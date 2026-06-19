import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
const TABLE = process.env.TABLE_NAME;
const VIDEO_BUCKET = process.env.VIDEO_BUCKET;

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  const method = (event.requestContext?.http?.method || event.httpMethod || '').toUpperCase();

  if (method !== 'GET') return respond(405, { error: 'Method not allowed' });

  const profileId = event.pathParameters?.profileId || event.queryStringParameters?.profileId;
  if (!profileId) return respond(400, { error: 'Missing profileId' });
  if (!/^[\w-]{1,128}$/.test(profileId)) return respond(400, { error: 'Invalid profileId' });

  try {
    const result = await client.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${profileId}`,
        ':sk': 'VIDEO#',
      },
      Limit: 50,
    }));

    const allVideos = (result.Items || []).map(({ PK: _pk, SK: _sk, ...rest }) => rest);
    const publicVideos = allVideos.filter(v => v.is_public === true);

    const videos = await Promise.all(publicVideos.map(async video => {
      if (!video.video_url?.startsWith('video/')) return video;
      const videoUrl = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: VIDEO_BUCKET, Key: video.video_url,
      }), { expiresIn: 3600 });
      return { ...video, video_url: videoUrl };
    }));

    return respond(200, { profileId, videos });
  } catch (err) {
    console.error(err);
    return respond(500, { error: 'Internal server error' });
  }
}
