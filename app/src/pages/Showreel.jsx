import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { Trash2, Globe, Lock, Copy, Check, Video } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { getVideoUploadUrl } from '../utils/api';
import { getUserId } from '../utils/cognito';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { ShowreelPageSkeleton } from '../components/ui/Skeleton';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 700px;
  margin: 0 auto;
  overflow: hidden;
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1rem;
  padding-bottom: 5rem;

  @media (min-width: 768px) {
    padding-bottom: 1rem;
  }
`;

const ShareBar = styled(Card)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
`;

const ShareLabel = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const VideoCard = styled(Card)`
  margin-bottom: 0.75rem;
  padding: 0;
  overflow: hidden;
`;

const VideoPlayer = styled.video`
  width: 100%;
  max-height: 280px;
  display: block;
  background: #000;
`;

const VideoFooter = styled.div`
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const VideoTitle = styled.div`
  flex: 1;
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UploadZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding: 2rem 1.5rem;
  border: 2px dashed ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  cursor: pointer;
  text-align: center;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.85rem;
  transition: border-color 0.15s, color 0.15s;
  margin-bottom: 1.25rem;

  &:hover {
    border-color: ${({ theme }) => theme.primary};
    color: ${({ theme }) => theme.text};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadProgress = styled.div`
  margin-bottom: 1.25rem;
`;

const ProgressBar = styled.div`
  height: 4px;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  margin-top: 0.375rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme }) => theme.primary};
  border-radius: 2px;
  transition: width 0.2s ease;
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
  font-size: 0.875rem;
  margin-bottom: 0.625rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
  }
`;

function generateId() {
  return `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function Showreel() {
  const { items: videos, loading, create, update, remove, reload } = useResource('videos');
  const [userId, setUserId] = useState(null);
  const [copying, setCopying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTitle, setUploadTitle] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [toggling, setToggling] = useState(new Set());
  const [deleting, setDeleting] = useState(new Set());
  const [retriedVideos, setRetriedVideos] = useState(new Set());
  const xhrRef = useRef(null);

  useEffect(() => { document.title = 'Showreel | My Tight Five'; }, []);

  useEffect(() => {
    getUserId().then(setUserId).catch(() => {});
  }, []);

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const showreelUrl = userId ? `${appUrl}/u/${userId}` : '';

  async function copyShowreelUrl() {
    if (!showreelUrl) return;
    await navigator.clipboard.writeText(showreelUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 1500);
  }

  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File is too large. Maximum size is 2 GB.');
      e.target.value = '';
      return;
    }
    setPendingFile(file);
    setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
    e.target.value = '';
  }

  async function startUpload() {
    if (!pendingFile) return;
    setUploading(true);
    setUploadProgress(0);
    const videoId = generateId();
    try {
      const { uploadUrl, videoUrl } = await getVideoUploadUrl(videoId, pendingFile.type);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', pendingFile.type);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(pendingFile);
      });

      await create({
        id: videoId,
        title: uploadTitle.trim() || 'Untitled',
        video_url: videoUrl,
        is_public: false,
        uploaded_at: new Date().toISOString(),
      });
      await reload();

      setPendingFile(null);
      setUploadTitle('');
      toast.success('Video uploaded');
    } catch (err) {
      if (err.name !== 'AbortError') toast.error("Couldn't upload video");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      xhrRef.current = null;
    }
  }

  function videoKey(url) {
    if (!url) return null;
    if (url.startsWith('video/')) return url;
    try { return new URL(url).pathname.slice(1); } catch { return null; }
  }

  async function togglePublic(video) {
    setToggling(prev => new Set(prev).add(video.id));
    try {
      await update(video.id, { ...video, video_url: videoKey(video.video_url), is_public: !video.is_public });
    } catch {
      toast.error("Couldn't update visibility");
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(video.id); return s; });
    }
  }

  async function handleDelete(video) {
    setDeleting(prev => new Set(prev).add(video.id));
    try {
      await remove(video.id);
      toast.success('Deleted');
    } catch {
      toast.error("Couldn't delete video");
    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(video.id); return s; });
    }
  }

  if (loading) return <ShowreelPageSkeleton />;

  const sortedVideos = [...videos].sort((a, b) =>
    new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0)
  );

  return (
    <Page>
      <PageHeader title="Showreel" back="/" />
      <Body>
        {showreelUrl && (
          <ShareBar>
            <Globe size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
            <ShareLabel>{showreelUrl}</ShareLabel>
            <Button $size="sm" $variant="ghost" onClick={copyShowreelUrl}>
              {copying ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
              {copying ? 'Copied' : 'Copy link'}
            </Button>
          </ShareBar>
        )}

        {pendingFile ? (
          <Card style={{ marginBottom: '1.25rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {pendingFile.name}
            </div>
            <TitleInput
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
              placeholder="Video title"
              disabled={uploading}
            />
            {uploading ? (
              <UploadProgress>
                <div style={{ fontSize: '0.8rem' }}>Uploading… {uploadProgress}%</div>
                <ProgressBar><ProgressFill $pct={uploadProgress} /></ProgressBar>
              </UploadProgress>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button $variant="ghost" style={{ flex: 1 }} onClick={() => setPendingFile(null)}>Cancel</Button>
                <Button style={{ flex: 1 }} onClick={startUpload}>Upload</Button>
              </div>
            )}
          </Card>
        ) : (
          <UploadZone>
            <Video size={28} strokeWidth={1.5} />
            <span>Choose a video to upload</span>
            <HiddenInput
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </UploadZone>
        )}

        {sortedVideos.length === 0 && !pendingFile && (
          <EmptyState message="No videos yet. Upload your first performance." />
        )}

        {sortedVideos.map(video => (
          <VideoCard key={video.id}>
            <VideoPlayer
              src={video.video_url}
              controls
              preload="metadata"
              onError={() => {
                if (!retriedVideos.has(video.id)) {
                  setRetriedVideos(prev => new Set(prev).add(video.id));
                  reload();
                }
              }}
            />
            <VideoFooter>
              <VideoTitle>{video.title || 'Untitled'}</VideoTitle>
              <Button
                $size="sm"
                $variant="ghost"
                $loading={toggling.has(video.id)}
                onClick={() => togglePublic(video)}
                title={video.is_public ? 'Make private' : 'Make public'}
              >
                {video.is_public
                  ? <><Globe size={14} strokeWidth={2} /> Public</>
                  : <><Lock size={14} strokeWidth={2} /> Private</>}
              </Button>
              <Button
                $size="sm"
                $variant="ghost"
                $loading={deleting.has(video.id)}
                onClick={() => handleDelete(video)}
                title="Delete"
              >
                <Trash2 size={14} strokeWidth={2} />
              </Button>
            </VideoFooter>
          </VideoCard>
        ))}
      </Body>
    </Page>
  );
}
