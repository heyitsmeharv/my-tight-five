import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { GripVertical, X, Plus, CornerDownLeft, Pencil, Headphones, SkipForward, SkipBack, ChevronDown, ChevronLeft, ChevronRight, Check, Mic, StopCircle, Trash2, Repeat } from 'lucide-react';
import { getAudioUploadUrl, deleteAudioFile } from '../utils/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { SetDetailSkeleton, SetPracticeOverlaySkeleton } from '../components/ui/Skeleton';

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
  opacity: ${({ $dragging }) => $dragging ? 0.5 : 1};
  transition: box-shadow 0.15s;

  &:hover { box-shadow: ${({ theme }) => theme.shadow}; }
`;

const DragHandle = styled.span`
  color: ${({ theme }) => theme.textMuted};
  flex-shrink: 0;
  opacity: 0.5;
  cursor: grab;
  display: flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 0.25rem;
  touch-action: none;

  &:active { cursor: grabbing; }
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

const JokeCategory = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  background: ${({ theme }) => theme.primaryLight};
  border-radius: 99px;
  padding: 0.0625rem 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const FooterSpacer = styled.div`flex: 1;`;

const ModeBar = styled.div`
  display: flex;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.bg};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  position: sticky;
  top: 4rem;
  z-index: 9;

  @media (min-width: 768px) {
    display: none;
  }
`;

const DesktopActions = styled.div`
  display: none;
  gap: 0.375rem;
  align-items: center;

  @media (min-width: 768px) {
    display: flex;
  }
`;

const RecordingBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 0.82rem;
`;

const RecordingBarLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.textMuted};
  flex-shrink: 0;
`;

const ListenLoopBtn = styled(Button)`
  color: ${({ $on, theme }) => $on ? theme.primary : 'inherit'};
`;

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
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  opacity: ${({ $added }) => $added ? 0.45 : 1};
  transition: opacity 0.15s;
`;

const JokePickSetup = styled.div`
  font-weight: 500;
  font-size: 0.88rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const JokePickPunchline = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  font-style: italic;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-top: 0.1rem;
`;

const PickSectionHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textMuted};
  padding: 0.625rem 0 0.375rem;
  transition: color 0.15s;

  &:hover { color: ${({ theme }) => theme.text}; }
`;

const PickSectionLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${({ theme }) => theme.border};
`;

const PickSectionCount = styled.span`
  font-size: 0.75rem;
  opacity: 0.5;
`;

const PickThread = styled.div`
  display: flex;
  flex-direction: column;
`;

const PickThreadToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.65rem;
  font-weight: 700;
  color: ${({ theme }) => theme.secondary};
  background: ${({ theme }) => theme.accent};
  padding: 0.2rem 0.5rem;
  border-radius: 99px;
  flex-shrink: 0;
  transition: opacity 0.15s;

  svg {
    transition: transform 0.2s ease;
    transform: rotate(${({ $collapsed }) => $collapsed ? '-90deg' : '0deg'});
  }

  &:hover { opacity: 0.75; }
`;

const PickThreadChildren = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 1rem;
  padding-left: 0.75rem;
  border-left: 2px solid ${({ theme }) => theme.border};
`;

const PracticeOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.bg};
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const OverlayTopBar = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem 0;
`;

const OverlayCloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.textMuted};
  padding: 0.25rem;
  transition: color 0.15s;
  &:hover { color: ${({ theme }) => theme.text}; }
`;

const OverlayBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 2.5rem;

  @media (min-width: 501px) {
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  @media (max-width: 500px) {
    padding: 2rem 1.25rem;
    justify-content: flex-start;
    padding-top: 2.5rem;
  }
`;

const OverlayProgress = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 1rem;
`;


const OverlayNav = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border-top: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.bg};

  @media (max-width: 500px) {
    padding: 0.875rem 1.25rem;
  }
`;

const OverlayNavBtn = styled.button`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.875rem;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-size: 0.9rem;
  font-weight: 600;
  min-height: 3rem;
  cursor: pointer;
  border: 1px solid ${({ $primary, theme }) => $primary ? theme.primary : theme.border};
  background: ${({ $primary, theme }) => $primary ? theme.primary : 'transparent'};
  color: ${({ $primary, theme }) => $primary ? theme.textInverse : theme.text};
  transition: opacity 0.15s;
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const TimerDisplay = styled.div`
  font-size: clamp(4rem, 10vw, 7rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -2px;
  color: ${({ $over, theme }) => $over ? theme.danger : theme.text};
  margin-bottom: 0.75rem;
`;

const TimerTarget = styled.div`
  font-size: clamp(1.25rem, 2.5vw, 1.85rem);
  color: ${({ theme }) => theme.textMuted};
  letter-spacing: 0.04em;
  margin-bottom: 2rem;
`;

const JokeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: min(720px, 90vw);
  text-align: left;
`;

const CurrentJoke = styled.div`
  font-size: clamp(1.25rem, 2.5vw, 1.85rem);
  font-weight: 600;
  line-height: 1.45;
  margin-bottom: 1.25rem;
`;

const CurrentPunchline = styled.div`
  font-size: clamp(1.1rem, 2vw, 1.55rem);
  line-height: 1.5;
  color: ${({ theme }) => theme.text};
  border-left: 3px solid ${({ theme }) => theme.primary};
  padding-left: 1rem;
  margin-bottom: 1.25rem;
`;

const CurrentFollowup = styled.div`
  font-size: clamp(1rem, 1.8vw, 1.35rem);
  line-height: 1.5;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 1.25rem;
`;


const OverlayRecSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: min(480px, 90vw);
  margin-bottom: 1.5rem;
`;

const OverlayRecLabel = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const OverlayRecBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
`;

const RecHint = styled.p`
  font-size: 0.75rem;
  color: ${({ $warn, theme }) => $warn ? theme.danger : theme.textMuted};
  opacity: ${({ $warn }) => $warn ? 1 : 0.6};
  margin-top: 0.25rem;
  margin-bottom: 1.25rem;
`;

const PracticeRecBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  border: 1px solid ${({ theme }) => theme.border};
  background: transparent;
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radiusSm};
  cursor: pointer;
  margin-bottom: 0.375rem;
  transition: color 0.15s, border-color 0.15s;
  &:hover { color: ${({ theme }) => theme.text}; border-color: ${({ theme }) => theme.textMuted}; }
`;

const SET_MIME_TYPE = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
  ? 'audio/webm'
  : 'audio/mp4';
const SET_REC_MAX_SECS = 60 * 60;

const recPulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
`;

const SetRecSection = styled.div`
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const SetRecLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.625rem;
`;

const SetRecBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const RecTimer = styled.span`
  font-family: monospace;
  font-size: 0.9rem;
  min-width: 2.75rem;
  color: ${({ $warn, theme }) => $warn ? theme.danger : 'inherit'};
`;

const RecDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.danger};
  flex-shrink: 0;
  animation: ${recPulse} 1.2s ease-in-out infinite;
`;

const RecTrack = styled.div`
  flex: 1;
  height: 4px;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  overflow: hidden;
`;

const RecFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.danger};
  border-radius: 2px;
  width: ${({ $pct }) => $pct}%;
  transition: width 0.05s linear;
`;

const SetRecStopBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.62rem;
  font-weight: 700;
  color: ${({ theme }) => theme.danger};
  border: 1px solid ${({ theme }) => theme.danger};
  background: transparent;
  padding: 0.35rem 0.625rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.8; }
`;

const SetRecActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`;

const SetRecAudio = styled.audio`
  width: 100%;
  margin-bottom: 0.5rem;
  border-radius: ${({ theme }) => theme.radiusSm};
`;

function SortableJoke({ id, joke, onRemove, callbackWarning, jokeMap }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  if (!joke) return null;

  const stageKey = joke.stage || 'draft';
  const color = STAGE_COLOR[stageKey]?.color;
  const category = joke.tags?.[0] ?? null;
  const callbackJoke = joke.callback_to ? jokeMap?.[joke.callback_to] : null;

  return (
    <SortableItem ref={setNodeRef} style={style} $dragging={isDragging} $color={color} {...attributes}>
      <DragHandle ref={setActivatorNodeRef} {...listeners}><GripVertical size={16} strokeWidth={2} /></DragHandle>
      <JokeInfo>
        <JokeSetup>{joke.setup || 'Untitled'}</JokeSetup>

        {joke.punchline && (
          <JokePunchline>{joke.punchline}</JokePunchline>
        )}

        {joke.notes && (
          <JokeNotes>{joke.notes}</JokeNotes>
        )}

        {joke.callback_to && callbackJoke && (
          <JokeCallbackRow
            $warning={callbackWarning}
            onClick={e => { e.stopPropagation(); navigate(`/jokes/${joke.callback_to}`); }}
            title={callbackJoke.setup || 'Jump to callback joke'}
          >
            <CornerDownLeft size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
            {callbackWarning ? '⚠ out of order · ' : ''}{callbackJoke.setup || 'Untitled'}
          </JokeCallbackRow>
        )}

        <JokeMeta>
          <StageBadge stage={stageKey} />
          {joke.duration_seconds > 0 && (
            <JokeDuration>{formatDuration(joke.duration_seconds)}</JokeDuration>
          )}
          {category && <JokeCategory>{category}</JokeCategory>}
          {joke.audio_url && <FooterSpacer />}
          {joke.audio_url && <span onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}><InlinePlayer url={joke.audio_url} /></span>}
        </JokeMeta>
      </JokeInfo>
      <Button $variant="ghost" $size="sm" onPointerDown={e => e.stopPropagation()} onClick={() => onRemove(id)} aria-label="Remove joke from set"><X size={14} strokeWidth={2} /></Button>
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
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [listening, setListening] = useState(false);
  const [listenIdx, setListenIdx] = useState(0);
  const [listenLoop, setListenLoop] = useState(false);
  const listenAudio = useRef(null);
  const listeningRef = useRef(false);
  const listenLoopRef = useRef(false);
  const timer = useTimer();
  useEffect(() => { listeningRef.current = listening; }, [listening]);
  useEffect(() => { listenLoopRef.current = listenLoop; }, [listenLoop]);
  useEffect(() => () => { listenAudio.current?.pause(); }, []);
  useEffect(() => {
    if (!practicing) return;
    document.body.style.overflow = 'hidden';
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') practiceNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') practicePrev();
      if (e.key === 'Escape') stopPractice();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [practicing]);

  const [setRecStatus, setSetRecStatus] = useState('idle');
  const [setRecElapsed, setSetRecElapsed] = useState(0);
  const [setRecLevel, setSetRecLevel] = useState(0);
  const [setRecLocalUrl, setSetRecLocalUrl] = useState(null);
  const [recHitMax, setRecHitMax] = useState(false);
  const setMrRef = useRef(null);
  const setStreamRef = useRef(null);
  const setRecBlobRef = useRef(null);
  const setRecLocalUrlRef = useRef(null);
  const setRecTimerRef = useRef(null);
  const setRecMaxTimerRef = useRef(null);
  const setRecAnimRef = useRef(null);
  const setAudioCtxRef = useRef(null);

  useEffect(() => () => {
    clearInterval(setRecTimerRef.current);
    clearTimeout(setRecMaxTimerRef.current);
    cancelAnimationFrame(setRecAnimRef.current);
    setAudioCtxRef.current?.close();
    if (setMrRef.current?.state !== 'inactive') setMrRef.current?.stop();
    setStreamRef.current?.getTracks().forEach(t => t.stop());
    if (setRecLocalUrlRef.current) URL.revokeObjectURL(setRecLocalUrlRef.current);
  }, []);

  useEffect(() => {
    if (practicing && setRecStatus === 'recording' && !timer.running) timer.start();
  }, [setRecStatus, practicing]);

  const set = sets.find(s => s.id === id);
  useEffect(() => {
    document.title = set ? `${set.name} | My Tight Five` : 'My Tight Five';
  }, [set?.name]);
  useEffect(() => {
    if (set?.audio_url && setRecStatus === 'idle') setSetRecStatus('done');
  }, [set?.audio_url]);

  const [jokeIds, setJokeIds] = useState([]);
  const [addingJoke, setAddingJoke] = useState(null);
  const [collapsedPickGroups, setCollapsedPickGroups] = useState(new Set());
  const [collapsedPickThreads, setCollapsedPickThreads] = useState(new Set());

  useEffect(() => {
    if (set) setJokeIds(set.joke_ids || []);
  }, [set]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 10 } }),
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
      if (listenLoopRef.current) { playAtIdx(0); return; }
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
    audio.onerror = () => { if (listeningRef.current) playAtIdx(idx + 1); };
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

  async function startSetRecording() {
    setRecHitMax(false);
    setSetRecStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStreamRef.current = stream;
      const chunks = [];
      const mr = new MediaRecorder(stream, { mimeType: SET_MIME_TYPE });
      setMrRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        clearInterval(setRecTimerRef.current);
        clearTimeout(setRecMaxTimerRef.current);
        cancelAnimationFrame(setRecAnimRef.current);
        setAudioCtxRef.current?.close();
        setAudioCtxRef.current = null;
        setSetRecLevel(0);
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: SET_MIME_TYPE });
        setRecBlobRef.current = blob;
        if (setRecLocalUrlRef.current) URL.revokeObjectURL(setRecLocalUrlRef.current);
        const url = URL.createObjectURL(blob);
        setRecLocalUrlRef.current = url;
        setSetRecLocalUrl(url);
        setSetRecStatus('recorded');
      };
      mr.start();
      setRecMaxTimerRef.current = setTimeout(() => { setRecHitMax(true); stopSetRecording(); }, SET_REC_MAX_SECS * 1000);
      setSetRecElapsed(0);
      setRecTimerRef.current = setInterval(() => setSetRecElapsed(s => s + 1), 1000);
      try {
        const ctx = new AudioContext();
        setAudioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        function tick() {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setSetRecLevel(Math.round((avg / 255) * 100));
          setRecAnimRef.current = requestAnimationFrame(tick);
        }
        tick();
      } catch { /* level meter unavailable */ }
      setSetRecStatus('recording');
    } catch {
      setStreamRef.current?.getTracks().forEach(t => t.stop());
      setSetRecStatus('idle');
      toast.error("Couldn't access microphone");
    }
  }

  function stopSetRecording() { setMrRef.current?.stop(); }

  async function uploadSetRecording() {
    const MAX_SET_BYTES = 100 * 1024 * 1024;
    if (setRecBlobRef.current?.size > MAX_SET_BYTES) {
      toast.error('Recording is too large to save.');
      return;
    }
    setSetRecStatus('uploading');
    try {
      const { uploadUrl, audioUrl: newAudioUrl } = await getAudioUploadUrl(id, SET_MIME_TYPE);
      await fetch(uploadUrl, { method: 'PUT', body: setRecBlobRef.current, headers: { 'Content-Type': SET_MIME_TYPE } });
      await update(id, { ...set, audio_url: newAudioUrl });
      if (setRecLocalUrlRef.current) URL.revokeObjectURL(setRecLocalUrlRef.current);
      setRecLocalUrlRef.current = null;
      setSetRecLocalUrl(null);
      setRecBlobRef.current = null;
      setSetRecStatus('done');
      toast.success('Set recording saved');
    } catch {
      setSetRecStatus('recorded');
      toast.error("Couldn't save recording");
    }
  }

  function discardSetRecording() {
    if (setRecLocalUrlRef.current) URL.revokeObjectURL(setRecLocalUrlRef.current);
    setRecLocalUrlRef.current = null;
    setSetRecLocalUrl(null);
    setRecBlobRef.current = null;
    setRecHitMax(false);
    setSetRecStatus('idle');
  }

  async function deleteSetRecording() {
    try {
      await update(id, { ...set, audio_url: null });
      setSetRecStatus('idle');
      deleteAudioFile(id).catch(() => {});
    } catch {
      toast.error("Couldn't delete recording");
    }
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

  function togglePickThread(id) {
    setCollapsedPickThreads(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePickGroup(cat) {
    setCollapsedPickGroups(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  const allJokeIds = new Set(jokes.map(j => j.id));
  const pickCbMap = {};
  jokes.forEach(j => {
    if (j.callback_to && allJokeIds.has(j.callback_to)) {
      (pickCbMap[j.callback_to] = pickCbMap[j.callback_to] || []).push(j);
    }
  });

  const pickGroups = {};
  jokes
    .filter(j => !j.callback_to || !allJokeIds.has(j.callback_to))
    .forEach(j => {
      const cat = j.tags?.[0] || '';
      (pickGroups[cat] = pickGroups[cat] || []).push(j);
    });
  const pickGroupKeys = Object.keys(pickGroups).sort((a, b) => {
    if (!a && b) return 1;
    if (a && !b) return -1;
    return a.localeCompare(b);
  });

  function renderPickNode(joke) {
    const children = pickCbMap[joke.id] || [];
    const inSet = jokeIds.includes(joke.id);
    const isThreadCollapsed = collapsedPickThreads.has(joke.id);
    return (
      <PickThread key={joke.id}>
        <JokePickRow $added={inSet}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <JokePickSetup>{joke.setup?.slice(0, 70) || 'Untitled'}</JokePickSetup>
            {joke.punchline && <JokePickPunchline>{joke.punchline}</JokePickPunchline>}
            <JokePickMeta>
              <StageBadge stage={joke.stage || 'draft'} />
              {joke.duration_seconds > 0 && formatDuration(joke.duration_seconds)}
            </JokePickMeta>
          </div>
          {children.length > 0 && (
            <PickThreadToggle $collapsed={isThreadCollapsed} onClick={() => togglePickThread(joke.id)}>
              {isThreadCollapsed && children.length}
              <ChevronDown size={11} strokeWidth={2.5} />
            </PickThreadToggle>
          )}
          {joke.audio_url && <span onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}><InlinePlayer url={joke.audio_url} /></span>}
          {inSet
            ? <Button $variant="ghost" $size="sm" onClick={() => removeJoke(joke.id)} disabled={addingJoke !== null}>Remove</Button>
            : <Button $size="sm" onClick={() => addJoke(joke.id)} $loading={addingJoke === joke.id} disabled={addingJoke !== null}>Add</Button>
          }
        </JokePickRow>
        {children.length > 0 && !isThreadCollapsed && (
          <PickThreadChildren>
            {children.map(child => renderPickNode(child))}
          </PickThreadChildren>
        )}
      </PickThread>
    );
  }

  function startPractice() {
    timer.reset();
    setPracticeIdx(0);
    setPracticeLoading(true);
    setTimeout(() => {
      setPracticeLoading(false);
      setPracticing(true);
    }, 1500);
  }

  function stopPractice() {
    timer.stop();
    setPracticing(false);
    setPracticeLoading(false);
    if (setMrRef.current?.state === 'recording') stopSetRecording();
  }

  function practiceNext() {
    setPracticeIdx(i => (i < setJokes.length - 1 ? i + 1 : i));
  }

  function practicePrev() {
    setPracticeIdx(i => (i > 0 ? i - 1 : i));
  }

  const currentJoke = setJokes[practiceIdx] || null;

  return (
    <Page>
      <PageHeader
        title={set.name}
        back="/sets"
        actions={
          <DesktopActions>
            {jokesWithAudio.length > 0 && (
              <Button $variant="ghost" $size="sm" onClick={listening ? stopListening : startListening}>
                <Headphones size={14} strokeWidth={2} />{listening ? 'Stop' : 'Listen'}
              </Button>
            )}
            <Button $variant="ghost" $size="sm" onClick={() => navigate(`/sets/${id}/read`)}>Read</Button>
            <Button $size="sm" onClick={startPractice}>Practice</Button>
          </DesktopActions>
        }
      />
      <ModeBar>
        {jokesWithAudio.length > 0 && (
          <Button $variant="ghost" $size="sm" onClick={listening ? stopListening : startListening}>
            <Headphones size={14} strokeWidth={2} />{listening ? 'Stop' : 'Listen'}
          </Button>
        )}
        <Button $variant="ghost" $size="sm" onClick={() => navigate(`/sets/${id}/read`)}>Read</Button>
        <Button $size="sm" onClick={startPractice}>Practice</Button>
      </ModeBar>

      {setRecStatus === 'done' && set.audio_url && (
        <RecordingBar>
          <RecordingBarLabel>Recording</RecordingBarLabel>
          <InlinePlayer url={set.audio_url} showLoop />
          <Button $variant="ghost" $size="sm" onClick={deleteSetRecording} style={{ marginLeft: 'auto' }}>
            <Trash2 size={13} strokeWidth={2} />Delete
          </Button>
        </RecordingBar>
      )}

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
          <ListenSetup>{jokesWithAudio[listenIdx]?.setup?.slice(0, 70) || '-'}</ListenSetup>
          <ListenCount>{listenIdx + 1} / {jokesWithAudio.length}</ListenCount>
          <Button $variant="ghost" $size="sm" onClick={() => playAtIdx(listenIdx - 1)} disabled={listenIdx === 0} title="Previous"><SkipBack size={13} strokeWidth={2} /></Button>
          <Button $variant="ghost" $size="sm" onClick={() => playAtIdx(listenIdx + 1)} title="Skip"><SkipForward size={13} strokeWidth={2} /></Button>
          <ListenLoopBtn $variant="ghost" $size="sm" $on={listenLoop} onClick={() => setListenLoop(v => !v)} title={listenLoop ? 'Loop on' : 'Loop off'}><Repeat size={13} strokeWidth={2} /></ListenLoopBtn>
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
              {jokes.length === 0 ? (
                <AddJokeEmptyMsg>
                  No jokes yet - <Link to="/jokes/new">Write one</Link>
                </AddJokeEmptyMsg>
              ) : pickGroupKeys.map(cat => {
                const groupJokes = pickGroups[cat];
                const label = cat || 'Uncategorized';
                const isCollapsed = collapsedPickGroups.has(cat);
                return (
                  <div key={cat || '__none__'}>
                    <PickSectionHeader onClick={() => togglePickGroup(cat)}>
                      <ChevronDown
                        size={11}
                        strokeWidth={2.5}
                        style={{
                          transform: isCollapsed ? 'rotate(-90deg)' : 'none',
                          transition: 'transform 0.2s ease',
                          flexShrink: 0,
                        }}
                      />
                      {label}
                      <PickSectionLine />
                      <PickSectionCount>{groupJokes.length}</PickSectionCount>
                    </PickSectionHeader>
                    {!isCollapsed && groupJokes.map(j => renderPickNode(j))}
                  </div>
                );
              })}
            </Card>
          )}
        </AddJokeSection>
      </Body>

      {practiceLoading && <SetPracticeOverlaySkeleton />}

      {!practiceLoading && (practicing || ['requesting', 'recording', 'recorded', 'uploading'].includes(setRecStatus)) && (
        <PracticeOverlay>
          <OverlayTopBar>
            <OverlayCloseBtn onClick={stopPractice} aria-label="Stop practice">
              <X size={22} strokeWidth={2} />
            </OverlayCloseBtn>
          </OverlayTopBar>
          <OverlayBody>
            <TimerDisplay $over={target && timer.seconds > target}>{formatTimer(timer.seconds)}</TimerDisplay>
            <TimerTarget>Target: {target ? formatDuration(target) : 'No target set'}</TimerTarget>

            {practicing && timer.running && currentJoke && (
              <JokeSection>
                <OverlayProgress>Joke {practiceIdx + 1} / {setJokes.length}</OverlayProgress>
                <CurrentJoke>{currentJoke.setup}</CurrentJoke>
                {currentJoke.punchline && <CurrentPunchline>{currentJoke.punchline}</CurrentPunchline>}
                {currentJoke.followup && <CurrentFollowup>{currentJoke.followup}</CurrentFollowup>}
              </JokeSection>
            )}

            {practicing && !timer.running && setRecStatus !== 'requesting' && (
              <>
                <PracticeRecBtn onClick={startSetRecording}>
                  <Mic size={14} strokeWidth={2} />Record and start
                </PracticeRecBtn>
                <RecHint>Max 60 min recording</RecHint>
                <button
                  onClick={() => timer.start()}
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #888)', textDecoration: 'underline', background: 'none', cursor: 'pointer' }}
                >
                  Start without recording
                </button>
              </>
            )}

            {setRecStatus === 'requesting' && (
              <PracticeRecBtn disabled style={{ opacity: 0.5 }}>
                <Mic size={14} strokeWidth={2} />Starting mic…
              </PracticeRecBtn>
            )}

            {setRecStatus === 'recording' && (
              <>
                <OverlayRecBar>
                  <RecDot />
                  <RecTimer $warn={setRecElapsed >= SET_REC_MAX_SECS - Math.min(30, Math.ceil(SET_REC_MAX_SECS * 0.3))}>
                    {formatTimer(setRecElapsed)}
                  </RecTimer>
                  <RecTrack style={{ width: '8rem' }}><RecFill $pct={setRecLevel} /></RecTrack>
                </OverlayRecBar>
                {setRecElapsed >= SET_REC_MAX_SECS - Math.min(30, Math.ceil(SET_REC_MAX_SECS * 0.3)) && (
                  <RecHint $warn>Approaching max recording length</RecHint>
                )}
              </>
            )}

            {setRecStatus === 'recorded' && recHitMax && practicing && (
              <RecHint $warn>Max recording length reached - recording stopped</RecHint>
            )}

            {setRecStatus === 'idle' && practicing && timer.running && (
              <>
                <PracticeRecBtn onClick={startSetRecording}>
                  <Mic size={14} strokeWidth={2} />Record set
                </PracticeRecBtn>
                <RecHint>Max 60 min recording</RecHint>
              </>
            )}

            {!practicing && (setRecStatus === 'recorded' || setRecStatus === 'uploading') && (
              <OverlayRecSection>
                <OverlayRecLabel>Save your recording?</OverlayRecLabel>
                {recHitMax && <RecHint $warn style={{ marginTop: 0 }}>Recording stopped at max duration</RecHint>}
                <SetRecAudio src={setRecLocalUrl} controls />
                <SetRecActions>
                  <Button onClick={uploadSetRecording} disabled={setRecStatus === 'uploading'}>
                    {setRecStatus === 'uploading' ? 'Saving…' : 'Save recording'}
                  </Button>
                  <Button $variant="ghost" onClick={discardSetRecording} disabled={setRecStatus === 'uploading'}>
                    Discard
                  </Button>
                </SetRecActions>
              </OverlayRecSection>
            )}
          </OverlayBody>

          {practicing && timer.running && (
            <OverlayNav>
              <OverlayNavBtn onClick={practicePrev} disabled={practiceIdx === 0}>
                <ChevronLeft size={18} strokeWidth={2} />Prev
              </OverlayNavBtn>
              {practiceIdx === setJokes.length - 1
                ? <OverlayNavBtn $primary onClick={stopPractice}>
                  Done <Check size={16} strokeWidth={2.5} />
                </OverlayNavBtn>
                : <OverlayNavBtn $primary onClick={practiceNext}>
                  Next <ChevronRight size={18} strokeWidth={2} />
                </OverlayNavBtn>
              }
            </OverlayNav>
          )}
        </PracticeOverlay>
      )}
    </Page>
  );
}
