import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { GripVertical, X, Plus, CornerDownLeft, Pencil, Headphones, SkipForward, SkipBack } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useResource } from '../hooks/useResource';
import { useTimer } from '../hooks/useTimer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StageBadge from '../components/ui/StageBadge';
import InlinePlayer from '../components/ui/InlinePlayer';
import ConfirmModal from '../components/ui/ConfirmModal';
import { formatDuration, formatTimer, totalSetDuration, parseDurationInput } from '../utils/time';
import { STAGE_COLOR } from '../utils/stages';
import { SetDetailSkeleton } from '../components/ui/Skeleton';

const Page = styled.div`
  padding-bottom: 5rem;
  max-width: 600px;
  margin: 0 auto;

  @media (min-width: 768px) {
    padding-bottom: 1.5rem;
  }
`;

const Body = styled.div`
  padding: 1rem;
`;

const TimingBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: ${({ theme }) => theme.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 0.85rem;
  min-width: 0;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 2px;
  background: ${({ theme }) => theme.border};
  border-radius: 1px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $raw, theme }) =>
    $raw >= 120 ? theme.danger :
      $raw >= 100 ? theme.primary :
        $raw >= 50 ? theme.warning :
          theme.danger};
  border-radius: 1px;
  transition: width 0.4s ease, background 0.3s ease;
`;

const Duration = styled.span`
  font-weight: 600;
  color: ${({ $raw, theme }) => $raw >= 120 ? theme.danger : theme.primary};
`;

const CallbackWarning = styled.div`
  background: ${({ theme }) => theme.warningLight};
  color: ${({ theme }) => theme.warning};
  border: 1px solid ${({ theme }) => theme.warning};
  border-radius: ${({ theme }) => theme.radiusSm};
  padding: 0.5rem 0.75rem;
  font-size: 0.82rem;
  margin-bottom: 0.75rem;
`;

const JokeDuration = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const TargetSlash = styled.span`
  color: ${({ theme }) => theme.textMuted};
`;

const TargetBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.88rem;
  font-family: inherit;
  padding: 0.125rem 0.375rem;
  border-radius: ${({ theme }) => theme.radiusSm};
  cursor: pointer;
  transition: color 0.15s, background 0.15s;

  svg { opacity: 0.35; transition: opacity 0.15s; }
  &:hover { color: ${({ theme }) => theme.text}; background: ${({ theme }) => theme.bgInput}; }
  &:hover svg { opacity: 1; }
`;

const SetTargetBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.68rem;
  font-weight: 700;
  color: ${({ theme }) => theme.accent};
  border: 1px solid ${({ theme }) => theme.accent};
  background: ${({ theme }) => theme.accentLight};
  padding: 0.1875rem 0.625rem;
  border-radius: 99px;
  cursor: pointer;
  margin-left: 0.5rem;
  opacity: 0.85;
  transition: opacity 0.15s;
  &:hover { opacity: 1; }
`;

const TargetInput = styled.input`
  background: transparent;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.text};
  font-size: 0.88rem;
  font-family: inherit;
  width: 4.5rem;
  padding: 0 2px;
  text-align: right;
  outline: none;
`;

const EmptyMsg = styled.div`
  text-align: center;
  padding: 1.5rem 0;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.9rem;
`;

const AddJokeEmptyMsg = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  padding: 0.5rem 0;

  a {
    color: ${({ theme }) => theme.accent};
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    &:hover { opacity: 0.8; }
  }
`;

const JokePickMeta = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  display: flex;
  gap: 0.375rem;
  margin-top: 0.125rem;
`;

const SortableItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-left: 4px solid ${({ $color }) => $color ?? 'transparent'};
  border-radius: ${({ theme }) => theme.radius};
  margin-bottom: 0.5rem;
  touch-action: none;
  cursor: grab;
  opacity: ${({ $dragging }) => $dragging ? 0.5 : 1};
  transition: box-shadow 0.15s;

  &:active { cursor: grabbing; }
  &:hover { box-shadow: ${({ theme }) => theme.shadow}; }
`;

const DragHandle = styled.span`
  color: ${({ theme }) => theme.textMuted};
  flex-shrink: 0;
  padding-top: 0.125rem;
  opacity: 0.5;
`;

const JokeInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const JokeSetup = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 0.1875rem;
`;

const JokePunchline = styled.p`
  font-size: 0.8rem;
  font-style: italic;
  color: ${({ theme }) => theme.textMuted};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  margin-bottom: 0.25rem;
`;

const JokeNotes = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  padding-left: 0.5rem;
  border-left: 2px solid ${({ theme }) => theme.border};
  margin-bottom: 0.375rem;
`;

const JokeCallbackRow = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  text-align: left;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.63rem;
  color: ${({ $warning, theme }) => $warning ? theme.danger : theme.textMuted};
  opacity: 0.7;
  margin-bottom: 0.375rem;
  padding: 0.3rem 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: color 0.15s, opacity 0.15s;

  &:hover { opacity: 1; color: ${({ theme }) => theme.primary}; }
`;

const JokeMeta = styled.div`
  display: flex;
  gap: 0.375rem;
  align-items: center;
  margin-top: 0.25rem;
  flex-wrap: wrap;
`;

const JokeTagRow = styled.div`display: flex; gap: 0.25rem; flex-wrap: wrap;`;

const JokeTag = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  background: ${({ theme }) => theme.primaryLight};
  border-radius: 99px;
  padding: 0.0625rem 0.375rem;
`;

const FooterSpacer = styled.div`flex: 1;`;

const ListenBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 0.82rem;
`;

const ListenSetup = styled.span`
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: ${({ theme }) => theme.text};
`;

const ListenCount = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.textMuted};
  flex-shrink: 0;
`;

const AddJokeSection = styled.div`
  margin-top: 1rem;
`;

const JokePickRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  &:last-child { border-bottom: none; }
`;

const PracticeOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.bg};
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  text-align: center;
`;

const TimerDisplay = styled.div`
  font-size: 5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -2px;
  color: ${({ $over, theme }) => $over ? theme.danger : theme.text};
  margin-bottom: 0.5rem;
`;

const TimerTarget = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 2rem;
`;

const CurrentJoke = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const CurrentPunchline = styled.div`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textMuted};
  font-style: italic;
  margin-bottom: 0.75rem;
`;

const NextJoke = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 2.5rem;
`;

function SortableJoke({ id, joke, onRemove, callbackWarning, jokeMap }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  if (!joke) return null;

  const stageKey = joke.stage || 'draft';
  const color = STAGE_COLOR[stageKey]?.color;
  const tags = joke.tags?.slice(0, 4) ?? [];
  const callbackJoke = joke.callback_to ? jokeMap?.[joke.callback_to] : null;

  return (
    <SortableItem ref={setNodeRef} style={style} $dragging={isDragging} $color={color}>
      <DragHandle {...attributes} {...listeners}><GripVertical size={16} strokeWidth={2} /></DragHandle>
      <JokeInfo>
        <JokeSetup>{joke.setup || 'Untitled'}</JokeSetup>

        {joke.punchline && (
          <JokePunchline>{joke.punchline}</JokePunchline>
        )}

        {joke.notes && (
          <JokeNotes>{joke.notes}</JokeNotes>
        )}

        {joke.callback_to && (
          <JokeCallbackRow
            $warning={callbackWarning}
            onClick={e => { e.stopPropagation(); navigate(`/jokes/${joke.callback_to}`); }}
            title={callbackJoke?.setup || 'Jump to callback joke'}
          >
            <CornerDownLeft size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
            {callbackWarning ? '⚠ out of order · ' : ''}{callbackJoke?.setup ?? '—'}
          </JokeCallbackRow>
        )}

        <JokeMeta>
          <StageBadge stage={stageKey} />
          {joke.duration_seconds > 0 && (
            <JokeDuration>{formatDuration(joke.duration_seconds)}</JokeDuration>
          )}
          {tags.length > 0 && (
            <JokeTagRow>
              {tags.map(t => <JokeTag key={t}>#{t}</JokeTag>)}
            </JokeTagRow>
          )}
          {joke.audio_url && <FooterSpacer />}
          {joke.audio_url && <InlinePlayer url={joke.audio_url} />}
        </JokeMeta>
      </JokeInfo>
      <Button $variant="ghost" $size="sm" onClick={() => onRemove(id)} aria-label="Remove joke from set"><X size={14} strokeWidth={2} /></Button>
    </SortableItem>
  );
}

export default function SetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items: sets, loading: setsLoading, update } = useResource('sets');
  const { items: jokes, loading: jokesLoading } = useResource('jokes');
  const [deleting, setDeleting] = useState(false);
  const [showAddJokes, setShowAddJokes] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [listening, setListening] = useState(false);
  const [listenIdx, setListenIdx] = useState(0);
  const listenAudio = useRef(null);
  const listeningRef = useRef(false);
  const timer = useTimer();
  useEffect(() => { listeningRef.current = listening; }, [listening]);
  useEffect(() => () => { listenAudio.current?.pause(); }, []);

  const set = sets.find(s => s.id === id);
  useEffect(() => {
    document.title = set ? `${set.name} | My Tight Five` : 'My Tight Five';
  }, [set?.name]);

  const [jokeIds, setJokeIds] = useState([]);
  const [addingJoke, setAddingJoke] = useState(null);

  useEffect(() => {
    if (set) setJokeIds(set.joke_ids || []);
  }, [set]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (setsLoading || jokesLoading) return <SetDetailSkeleton />;
  if (!set) return null;

  const jokeMap = Object.fromEntries(jokes.map(j => [j.id, j]));
  const setJokes = jokeIds.map(jid => jokeMap[jid]).filter(Boolean);
  const totalDuration = totalSetDuration(jokeIds, jokeMap);
  const target = set.target_duration_seconds;
  const over = target && totalDuration > target;
  const jokesWithAudio = setJokes.filter(j => j.audio_url);

  function playAtIdx(idx) {
    if (!listeningRef.current && idx > 0) return;
    if (listenAudio.current) listenAudio.current.pause();
    if (idx >= jokesWithAudio.length) {
      setListening(false);
      setListenIdx(0);
      listenAudio.current = null;
      return;
    }
    const audio = new Audio(jokesWithAudio[idx].audio_url);
    listenAudio.current = audio;
    setListenIdx(idx);
    audio.play().catch(() => { });
    audio.onended = () => { if (listeningRef.current) playAtIdx(idx + 1); };
  }

  function startListening() {
    setListening(true);
    playAtIdx(0);
  }

  function stopListening() {
    listenAudio.current?.pause();
    listenAudio.current = null;
    setListening(false);
    setListenIdx(0);
  }

  function callbackWarning(jokeId) {
    const joke = jokeMap[jokeId];
    if (!joke?.callback_to) return false;
    const callbackIdx = jokeIds.indexOf(joke.callback_to);
    const thisIdx = jokeIds.indexOf(jokeId);
    return callbackIdx === -1 || callbackIdx >= thisIdx;
  }

  const hasCallbackWarnings = jokeIds.some(jid => callbackWarning(jid));

  function handleTargetSave() {
    setEditingTarget(false);
    const parsed = targetInput.trim() ? parseDurationInput(targetInput) : null;
    if (targetInput.trim() && (parsed === null || parsed <= 0)) {
      toast.error('Enter a valid duration (e.g. 5m or 5:00)');
      return;
    }
    update(id, { ...set, target_duration_seconds: parsed }).catch(() => {
      toast.error("Couldn't save duration");
    });
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = jokeIds.indexOf(active.id);
      const newIndex = jokeIds.indexOf(over.id);
      const prev = jokeIds;
      const next = arrayMove(jokeIds, oldIndex, newIndex);
      setJokeIds(next);
      try {
        await update(id, { ...set, joke_ids: next });
      } catch {
        setJokeIds(prev);
        toast.error("Couldn't reorder jokes");
      }
    }
  }

  async function removeJoke(jid) {
    const prev = jokeIds;
    const next = jokeIds.filter(x => x !== jid);
    setJokeIds(next);
    try {
      await update(id, { ...set, joke_ids: next });
    } catch {
      setJokeIds(prev);
      toast.error("Couldn't remove joke");
    }
  }

  async function addJoke(jid) {
    if (jokeIds.includes(jid)) return;
    setAddingJoke(jid);
    const prev = jokeIds;
    const next = [...jokeIds, jid];
    setJokeIds(next);
    try {
      await update(id, { ...set, joke_ids: next });
    } catch {
      setJokeIds(prev);
      toast.error("Couldn't add joke");
    } finally {
      setAddingJoke(null);
    }
  }

  const availableJokes = jokes.filter(j => !jokeIds.includes(j.id));

  function currentJokeForTimer() {
    let elapsed = 0;
    for (const jid of jokeIds) {
      const d = jokeMap[jid]?.duration_seconds || 0;
      if (timer.seconds < elapsed + d) return jokeMap[jid];
      elapsed += d;
    }
    return setJokes[setJokes.length - 1];
  }

  function nextJokeForTimer() {
    let elapsed = 0;
    for (let i = 0; i < jokeIds.length; i++) {
      const d = jokeMap[jokeIds[i]]?.duration_seconds || 0;
      if (timer.seconds < elapsed + d) {
        return jokeMap[jokeIds[i + 1]] || null;
      }
      elapsed += d;
    }
    return null;
  }

  function startPractice() {
    timer.reset();
    setPracticing(true);
    timer.start();
  }

  function stopPractice() {
    timer.stop();
    setPracticing(false);
  }

  const currentJoke = currentJokeForTimer();
  const nextJoke = nextJokeForTimer();

  return (
    <Page>
      <PageHeader
        title={set.name}
        back="/sets"
        actions={
          <>
            {jokesWithAudio.length > 0 && (
              <Button $variant="ghost" $size="sm" onClick={listening ? stopListening : startListening}>
                <Headphones size={14} strokeWidth={2} />{listening ? 'Stop' : 'Listen'}
              </Button>
            )}
            <Button $variant="ghost" $size="sm" onClick={() => navigate(`/sets/${id}/read`)}>Read</Button>
            <Button $size="sm" onClick={startPractice}>Practice</Button>
          </>
        }
      />

      <TimingBar>
        <span>{setJokes.length} joke{setJokes.length !== 1 ? 's' : ''}</span>
        {target
          ? <BarTrack><BarFill $pct={Math.min(100, (totalDuration / target) * 100)} $raw={(totalDuration / target) * 100} /></BarTrack>
          : <BarTrack />
        }
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Duration $raw={target ? (totalDuration / target) * 100 : 0}>{formatDuration(totalDuration)}</Duration>
          {editingTarget ? (
            <>
              <TargetSlash> / </TargetSlash>
              <TargetInput
                autoFocus
                value={targetInput}
                onChange={e => setTargetInput(e.target.value)}
                onBlur={handleTargetSave}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.target.blur();
                  if (e.key === 'Escape') setEditingTarget(false);
                }}
                placeholder="5m"
              />
            </>
          ) : target ? (
            <TargetBtn
              onClick={() => { setTargetInput(formatDuration(target)); setEditingTarget(true); }}
              title="Edit target duration"
            >
              {' / '}{formatDuration(target)}<Pencil size={16} strokeWidth={2} />
            </TargetBtn>
          ) : (
            <SetTargetBtn onClick={() => { setTargetInput(''); setEditingTarget(true); }}>
              <Pencil size={16} strokeWidth={2.5} />set target
            </SetTargetBtn>
          )}
        </span>
      </TimingBar>

      {listening && (
        <ListenBar>
          <Headphones size={13} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.6 }} />
          <ListenSetup>{jokesWithAudio[listenIdx]?.setup?.slice(0, 70) || '—'}</ListenSetup>
          <ListenCount>{listenIdx + 1} / {jokesWithAudio.length}</ListenCount>
          <Button $variant="ghost" $size="sm" onClick={() => playAtIdx(listenIdx - 1)} disabled={listenIdx === 0} title="Previous"><SkipBack size={13} strokeWidth={2} /></Button>
          <Button $variant="ghost" $size="sm" onClick={() => playAtIdx(listenIdx + 1)} title="Skip"><SkipForward size={13} strokeWidth={2} /></Button>
        </ListenBar>
      )}

      <Body>
        {hasCallbackWarnings && (
          <CallbackWarning>
            ⚠ One or more callbacks reference a joke that appears later in the set or isn't included.
          </CallbackWarning>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={jokeIds} strategy={verticalListSortingStrategy}>
            {jokeIds.map(jid => (
              <SortableJoke
                key={jid}
                id={jid}
                joke={jokeMap[jid]}
                onRemove={removeJoke}
                callbackWarning={callbackWarning(jid)}
                jokeMap={jokeMap}
              />
            ))}
          </SortableContext>
        </DndContext>

        {jokeIds.length === 0 && (
          <EmptyMsg>No jokes in this set yet.</EmptyMsg>
        )}

        <AddJokeSection>
          <Button $variant="ghost" $size="sm" onClick={() => setShowAddJokes(s => !s)} style={{ width: '100%' }}>
            {showAddJokes ? <><X size={14} strokeWidth={2} />Close</> : <><Plus size={14} strokeWidth={2} />Add joke</>}
          </Button>

          {showAddJokes && (
            <Card $compact style={{ marginTop: '0.625rem' }}>
              {availableJokes.length === 0 && (
                <AddJokeEmptyMsg>
                 There are no more available jokes - <Link to="/jokes/new">Write a new joke</Link>
                </AddJokeEmptyMsg>
              )}
              {availableJokes.map(j => (
                <JokePickRow key={j.id}>
                  <div style={{ flex: 1, fontSize: '0.88rem' }}>
                    <div style={{ fontWeight: 500 }}>{j.setup?.slice(0, 60) || 'Untitled'}</div>
                    <JokePickMeta>
                      <StageBadge stage={j.stage || 'draft'} />
                      {formatDuration(j.duration_seconds)}
                    </JokePickMeta>
                  </div>
                  <Button $size="sm" onClick={() => addJoke(j.id)} $loading={addingJoke === j.id} disabled={addingJoke !== null}>Add</Button>
                </JokePickRow>
              ))}
            </Card>
          )}
        </AddJokeSection>
      </Body>

      {practicing && (
        <PracticeOverlay>
          <TimerDisplay $over={target && timer.seconds > target}>{formatTimer(timer.seconds)}</TimerDisplay>
          <TimerTarget>Target: {target ? formatDuration(target) : 'No target set'}</TimerTarget>
          <CurrentJoke>{currentJoke?.setup?.slice(0, 80) || 'Set complete'}</CurrentJoke>
          {currentJoke?.punchline && (
            <CurrentPunchline>{currentJoke.punchline.slice(0, 100)}</CurrentPunchline>
          )}
          <NextJoke>{nextJoke ? `Next: ${nextJoke.setup?.slice(0, 60)}` : 'Last joke'}</NextJoke>
          <Button $variant="danger" onClick={stopPractice}>Stop</Button>
        </PracticeOverlay>
      )}
    </Page>
  );
}
