import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { X, Plus } from 'lucide-react';
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
  padding-bottom: 80px;
  max-width: 600px;
  margin: 0 auto;
`;

const Body = styled.div`
  padding: 16px;
`;

const SetCard = styled(Card)`
  position: relative;
  margin-bottom: 8px;
  cursor: pointer;
  padding: 20px 2.75rem 24px 24px;
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
  margin-bottom: 3px;
`;

const SetMeta = styled.div`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.textMuted};
`;

const MetaDuration = styled.span`
  color: ${({ $raw, theme }) => $raw >= 120 ? theme.danger : 'inherit'};
`;

const ProgressTrack = styled.div`
  height: 3px;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  margin-top: 8px;
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

  useEffect(() => { document.title = 'Sets | My Tight Five'; }, []);

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
          <Card style={{ marginBottom: 16 }}>
            <form onSubmit={handleCreate}>
              <FormGroup>
                <Label>Set name *</Label>
                <Input placeholder="Open Mic - 5 min" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </FormGroup>
              <FormGroup>
                <Label>Target duration</Label>
                <Input type="text" placeholder="e.g. 5:00 or 300s" value={target} onChange={e => setTarget(e.target.value)} />
              </FormGroup>
              <div style={{ display: 'flex', gap: 8 }}>
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

            return (
              <SetCard key={set.id} $i={i} onClick={() => navigate(`/sets/${set.id}`)}>
                <SetName>{set.name}</SetName>
                <SetMeta>
                  <span>
                    {jokeCount} joke{jokeCount !== 1 ? 's' : ''} ·{' '}
                    <MetaDuration $raw={targetDuration ? (duration / targetDuration) * 100 : 0}>{formatDuration(duration)}</MetaDuration>
                    {targetDuration && ` / ${formatDuration(targetDuration)}`}
                  </span>
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
