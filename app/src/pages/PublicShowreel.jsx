import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { fetchPublicProfile } from '../utils/api';

const Page = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.85rem;
  margin: 0;
`;

const VideoCard = styled.div`
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  overflow: hidden;
  margin-bottom: 1.25rem;
`;

const VideoPlayer = styled.video`
  width: 100%;
  max-height: 360px;
  display: block;
  background: #000;
`;

const VideoFooter = styled.div`
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.9rem;
`;

const Message = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.9rem;
`;

export default function PublicShowreel() {
  const { profileId } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retriedVideos, setRetriedVideos] = useState(new Set());

  useEffect(() => {
    document.title = 'Showreel | My Tight Five';
    fetchPublicProfile(profileId)
      .then(data => setVideos(data.videos || []))
      .catch(() => setError('Could not load this showreel.'))
      .finally(() => setLoading(false));
  }, [profileId]);

  if (loading) return <Message>Loading…</Message>;
  if (error) return <Message>{error}</Message>;

  return (
    <Page>
      <Header>
        <Title>Showreel</Title>
        {videos.length > 0 && (
          <Subtitle>{videos.length} performance{videos.length !== 1 ? 's' : ''}</Subtitle>
        )}
      </Header>

      {videos.length === 0 ? (
        <Message>No public videos yet.</Message>
      ) : (
        videos.map(video => (
          <VideoCard key={video.id}>
            <VideoPlayer
              src={video.video_url}
              controls
              preload="metadata"
              onError={() => {
                if (!retriedVideos.has(video.id)) {
                  setRetriedVideos(prev => new Set(prev).add(video.id));
                  fetchPublicProfile(profileId)
                    .then(data => setVideos(data.videos || []))
                    .catch(() => {});
                }
              }}
            />
            {video.title && <VideoFooter>{video.title}</VideoFooter>}
          </VideoCard>
        ))
      )}
    </Page>
  );
}
