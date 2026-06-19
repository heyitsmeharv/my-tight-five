import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { X, Plus, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useResource } from '../hooks/useResource';
import InlinePlayer from '../components/ui/InlinePlayer';
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
  display: flex;
  align-items: stretch;
  padding: 0;
  animation: ${({ $dragging }) => $dragging ? 'none' : fadeIn} 0.22s ease both;
  animation-delay: ${({ $i }) => Math.min($i * 50, 250)}ms;
  transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
  opacity: ${({ $dragging }) => $dragging ? 0.5 : 1};
  box-shadow: ${({ $dragging, theme }) => $dragging ? theme.shadowMd : 'none'};

  &:hover { border-color: ${({ theme }) => theme.primary}; }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  padding: 0 0.625rem;
  cursor: grab;
  color: ${({ theme }) => theme.textMuted};
  touch-action: none;
  opacity: 0.35;
  flex-shrink: 0;
  transition: opacity 0.15s;

  &:hover { opacity: 0.8; }
  &:active { cursor: grabbing; }
`;

const SetCardContent = styled.div`
  flex: 1;
  padding: 1.25rem 2.75rem 1.5rem 0.75rem;
  cursor: pointer;
  min-width: 0;
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

function SortableSetCard({ set, i, jokeMap, onDelete, onNavigate }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: set.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const duration = totalSetDuration(set.joke_ids || [], jokeMap);
  const targetDuration = set.target_duration_seconds;
  const jokeCount = (set.joke_ids || []).filter(jid => jokeMap[jid]).length;

  return (
    <SetCard ref={setNodeRef} style={style} $i={i} $dragging={isDragging} {...attributes}>
      <DragHandle ref={setActivatorNodeRef} {...listeners}>
        <GripVertical size={16} strokeWidth={2} />
      </DragHandle>
      <SetCardContent onClick={onNavigate}>
        <SetName>{set.name}</SetName>
        <SetMeta>
          <span>{jokeCount} joke{jokeCount !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {set.audio_url && (
              <span onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                <InlinePlayer url={set.audio_url} showLoop />
              </span>
            )}
            <span>
              <MetaDuration $raw={targetDuration ? (duration / targetDuration) * 100 : 0}>{formatDuration(duration)}</MetaDuration>
              {targetDuration > 0 && ` / ${formatDuration(targetDuration)}`}
            </span>
          </div>
        </SetMeta>
        {targetDuration > 0 && (
          <ProgressTrack>
            <ProgressFill $pct={Math.min(100, (duration / targetDuration) * 100)} $raw={(duration / targetDuration) * 100} />
          </ProgressTrack>
        )}
      </SetCardContent>
      <DeleteBtn $variant="ghost" $size="sm" onClick={e => { e.stopPropagation(); onDelete(set.id); }} aria-label="Delete set">
        <X size={14} strokeWidth={2} />
      </DeleteBtn>
    </SetCard>
  );
}

export default function Sets() {
  const navigate = useNavigate();
  const { items: sets, loading, create, update, remove } = useResource('sets');
  const { items: jokes } = useResource('jokes');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [setIds, setSetIds] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => { document.title = 'Sets | My Tight Five'; }, []);

  useEffect(() => {
    if (loading || setIds.length > 0) return;
    setSetIds(
      [...sets]
        .sort((a, b) => {
          if (a.sort_order != null && b.sort_order != null) return a.sort_order - b.sort_order;
          if (a.sort_order != null) return -1;
          if (b.sort_order != null) return 1;
          return 0;
        })
        .map(s => s.id)
    );
  }, [loading, sets]);

  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const prev = setIds;
    const next = arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id));
    setSetIds(next);
    try {
      await Promise.all(next.map((id, idx) => {
        const set = sets.find(s => s.id === id);
        return update(id, { ...set, sort_order: idx });
      }));
    } catch {
      setSetIds(prev);
      toast.error("Couldn't reorder sets");
    }
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
      setSetIds(prev => [created.id, ...prev]);
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
      setSetIds(prev => prev.filter(id => id !== deleting));
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={setIds} strategy={verticalListSortingStrategy}>
              {setIds.map((id, i) => {
                const set = sets.find(s => s.id === id);
                if (!set) return null;
                return (
                  <SortableSetCard
                    key={set.id}
                    set={set}
                    i={i}
                    jokeMap={jokeMap}
                    onDelete={id => setDeleting(id)}
                    onNavigate={() => navigate(`/sets/${set.id}`)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
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
