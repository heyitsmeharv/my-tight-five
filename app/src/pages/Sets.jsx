import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { X, Plus, Play, Square } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState, { EmptyAction } from '../components/ui/EmptyState';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Input, Label, FormGroup } from '../components/ui/Input';
import { SetsPageSkeleton } from '../components/ui/Skeleton';
import { formatDuration, totalSetDuration, parseDurationInput } from '../utils/time';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 600px;
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

const SetCard = styled(Card)`
  position: relative;
  margin-bottom: 0.5rem;
  cursor: pointer;
  padding: 1.25rem 2.75rem 1.5rem 1.5rem;
  animation: ${fadeIn} 0.22s ease both;
  animation-delay: ${({ $i }) => Math.min($i * 50, 250)}ms;
  transition: border-color 0.15s;

  &:hover { border-color: ${({ theme }) => theme.primary}; }
`;

const DeleteBtn = styled(Button)`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;

  @media (pointer: fine) {
    opacity: 0;
    transition: opacity 0.15s;
    ${SetCard}:hover & { opacity: 1; }
  }
`;

const SetName = styled.div`
  font-weight: 600;
  margin-bottom: 0.1875rem;
`;

const SetMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.textMuted};
`;

const MetaDuration = styled.span`
  color: ${({ $raw, theme }) => $raw >= 120 ? theme.danger : 'inherit'};
`;

const SetPlayBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.62rem;
  font-weight: 700;
  color: ${({ $playing, theme }) => $playing ? theme.primary : theme.accent};
  border: 1px solid ${({ $playing, theme }) => $playing ? theme.primary : theme.accent};
  background: ${({ $playing, theme }) => $playing ? 'transparent' : theme.accentLight};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  opacity: 0.9;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover { opacity: 1; }
`;

const ProgressTrack = styled.div`
  height: 3px;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $raw, theme }) =>
    $raw >= 120 ? theme.danger :
      $raw >= 100 ? theme.primary :
        $raw >= 50 ? theme.warning :
          theme.danger};
  border-radius: 2px;
  transition: width 0.4s ease, background 0.3s ease;
`;

export default function Sets() {
  const navigate = useNavigate();
  const { items: sets, loading, create, remove } = useResource('sets');
  const { items: jokes } = useResource('jokes');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [playingSetId, setPlayingSetId] = useState(null);
  const audioRef = useRef(null);
  const playingSetIdRef = useRef(null);

  useEffect(() => { document.title = 'Sets | My Tight Five'; }, []);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  function stopPlayback() {
    audioRef.current?.pause();
    audioRef.current = null;
    playingSetIdRef.current = null;
    setPlayingSetId(null);
  }

  function playNext(queue, index, setId) {
    if (playingSetIdRef.current !== setId || index >= queue.length) {
      if (playingSetIdRef.current === setId) stopPlayback();
      return;
    }
    const audio = new Audio(queue[index].audio_url);
    audioRef.current = audio;
    audio.onended = () => playNext(queue, index + 1, setId);
    audio.onerror = () => playNext(queue, index + 1, setId);
    audio.play().catch(() => playNext(queue, index + 1, setId));
  }

  function handlePlaySet(e, set) {
    e.stopPropagation();
    e.preventDefault();
    if (playingSetId === set.id) { stopPlayback(); return; }
    stopPlayback();
    const queue = (set.joke_ids || []).map(id => jokeMap[id]).filter(j => j?.audio_url);
    if (!queue.length) { toast.info('No recordings in this set'); return; }
    playingSetIdRef.current = set.id;
    setPlayingSetId(set.id);
    playNext(queue, 0, set.id);
  }

  if (loading) return <SetsPageSkeleton />;

  const jokeMap = Object.fromEntries(jokes.map(j => [j.id, j]));

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    const targetNum = target.trim() ? parseDurationInput(target) : null;
    if (target.trim() && targetNum === null) return toast.error('Enter a valid duration (e.g. 5:00)');
    if (targetNum !== null && targetNum <= 0) return toast.error('Duration must be greater than 0');
    setSaving(true);
    try {
      const created = await create({ name: name.trim(), joke_ids: [], target_duration_seconds: targetNum });
      setShowForm(false);
      setName('');
      setTarget('');
      navigate(`/sets/${created.id}`);
    } catch {
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await remove(deleting);
      toast.success('Deleted');
      setDeleting(null);
    } catch {
      toast.error("Couldn't delete");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Sets"
        back="/"
        actions={<Button $size="sm" onClick={() => setShowForm(s => !s)}>{showForm ? <X size={14} strokeWidth={2} /> : <><Plus size={14} strokeWidth={2} />New</>}</Button>}
      />
      <Body>
        {showForm && (
          <Card style={{ marginBottom: '1rem' }}>
            <form onSubmit={handleCreate}>
              <FormGroup>
                <Label>Set name *</Label>
                <Input placeholder="Open Mic - 5 min" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </FormGroup>
              <FormGroup>
                <Label>Target duration</Label>
                <Input type="text" placeholder="e.g. 5:00 or 300s" value={target} onChange={e => setTarget(e.target.value)} />
              </FormGroup>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button type="button" $variant="ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" disabled={saving} style={{ flex: 1 }}>Create</Button>
              </div>
            </form>
          </Card>
        )}

        {sets.length === 0 && !showForm ? (
          <EmptyState message="No sets yet.">
            <EmptyAction type="button" onClick={() => setShowForm(true)}>Create one</EmptyAction>
          </EmptyState>
        ) : (
          sets.map((set, i) => {
            const duration = totalSetDuration(set.joke_ids || [], jokeMap);
            const targetDuration = set.target_duration_seconds;
            const over = targetDuration && duration > targetDuration;
            const jokeCount = (set.joke_ids || []).filter(jid => jokeMap[jid]).length;
            const hasAudio = (set.joke_ids || []).some(id => jokeMap[id]?.audio_url);
            const isPlaying = playingSetId === set.id;

            return (
              <SetCard key={set.id} $i={i} onClick={() => navigate(`/sets/${set.id}`)}>
                <SetName>{set.name}</SetName>
                <SetMeta>
                  <span>{jokeCount} joke{jokeCount !== 1 ? 's' : ''}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {hasAudio && (
                      <SetPlayBtn $playing={isPlaying} onClick={e => handlePlaySet(e, set)} aria-label={isPlaying ? 'Stop set' : 'Play set'}>
                        {isPlaying ? <Square size={9} fill="currentColor" strokeWidth={0} /> : <Play size={9} fill="currentColor" strokeWidth={0} />}
                        {isPlaying ? 'STOP' : 'PLAY'}
                      </SetPlayBtn>
                    )}
                    <span>
                      <MetaDuration $raw={targetDuration ? (duration / targetDuration) * 100 : 0}>{formatDuration(duration)}</MetaDuration>
                      {targetDuration > 0 && ` / ${formatDuration(targetDuration)}`}
                    </span>
                  </div>
                </SetMeta>
                <DeleteBtn $variant="ghost" $size="sm" onClick={e => { e.stopPropagation(); setDeleting(set.id); }} aria-label="Delete set">
                  <X size={14} strokeWidth={2} />
                </DeleteBtn>
                {targetDuration > 0 && (
                  <ProgressTrack>
                    <ProgressFill $pct={Math.min(100, (duration / targetDuration) * 100)} $raw={(duration / targetDuration) * 100} />
                  </ProgressTrack>
                )}
              </SetCard>
            );
          })
        )}
      </Body>

      {deleting && (
        <ConfirmModal
          title="Delete set?"
          message="The jokes in this set won't be deleted."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </Page>
  );
}
