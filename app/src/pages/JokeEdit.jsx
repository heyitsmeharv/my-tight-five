import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ulid } from 'ulid';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { JokeEditSkeleton } from '../components/ui/Skeleton';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Select, Label, FormGroup } from '../components/ui/Input';
import AudioRecorder from '../components/AudioRecorder';
import { STAGES, STAGE_COLOR } from '../utils/stages';

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

  @media (max-width: 400px) {
    padding: 0.75rem;
  }
`;

const WritingArea = styled.div`
  margin-bottom: 1.5rem;
`;

const BitTextarea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.text};
  font-size: ${({ $large }) => $large ? '1.1rem' : '0.95rem'};
  line-height: 1.65;
  resize: none;
  padding: 0;
  min-height: ${({ $large }) => $large ? '6.25rem' : '4.5rem'};
  transition: color 0.15s;

  &:focus { outline: none; }
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
    opacity: 0.5;
  }
`;

const Divider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  margin: 0.75rem 0;
`;

const StageRow = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`;

const StageBtn = styled.button`
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid ${({ $active, $stage }) =>
    $active ? STAGE_COLOR[$stage]?.color : 'transparent'};
  background: ${({ $active, $stage }) =>
    $active ? STAGE_COLOR[$stage]?.bg : 'transparent'};
  color: ${({ $active, $stage, theme }) =>
    $active ? STAGE_COLOR[$stage]?.color : theme.textMuted};
  cursor: pointer;
  min-height: 1.875rem;
  transition: all 0.15s;

  &:hover {
    color: ${({ $stage }) => STAGE_COLOR[$stage]?.color};
  }
`;

const TagArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
  margin-bottom: 1.25rem;
  min-height: 2rem;
`;

const TagChip = styled.span`
  background: ${({ theme }) => theme.primaryLight};
  color: ${({ theme }) => theme.primary};
  border-radius: 99px;
  padding: 0.1875rem 0.625rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  gap: 0.3125rem;

  button {
    color: inherit;
    opacity: 0.6;
    font-size: 0.9rem;
    line-height: 1;
    &:hover { opacity: 1; }
  }
`;

const TagInput = styled.input`
  background: transparent;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text};
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  padding: 0.125rem 0.25rem;
  width: 6.25rem;
  transition: border-color 0.15s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
  }
  &::placeholder { color: ${({ theme }) => theme.textMuted}; opacity: 0.5; }
`;

const DetailsToggle = styled.button`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textMuted};
  padding: 0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: color 0.15s;

  &:hover { color: ${({ theme }) => theme.text}; }
`;

const DetailsPanel = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  padding-top: 1rem;
  margin-bottom: 1.25rem;
`;

const NoteTextarea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
  line-height: 1.6;
  resize: none;
  padding: 0.25rem 0;
  min-height: 3.75rem;

  &:focus { outline: none; border-color: ${({ theme }) => theme.primary}; }
  &::placeholder { color: ${({ theme }) => theme.textMuted}; opacity: 0.45; }
`;

const InlineInput = styled.input`
  background: transparent;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
  padding: 0.25rem 0;
  width: 100%;
  min-height: 2.25rem;

  &:focus { outline: none; border-color: ${({ theme }) => theme.primary}; }
  &::placeholder { color: ${({ theme }) => theme.textMuted}; opacity: 0.45; }
`;

const SaveRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export default function JokeEdit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { items: jokes, loading: jokesLoading, create, update, remove } = useResource('jokes');
  const { items: sets, update: updateSet } = useResource('sets');
  const isNew = !id;
  const fromIdea = location.state?.fromIdea;

  const [form, setForm] = useState({
    setup: fromIdea?.text || '',
    punchline: '',
    stage: 'draft',
    duration_seconds: '',
    notes: '',
    tags: [],
    callback_to: '',
    audio_url: null,
  });
  const [tagInput, setTagInput] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    document.title = `${isNew ? 'New Joke' : 'Edit Joke'} | My Tight Five`;
  }, [isNew]);

  const pendingIdRef = useRef(isNew ? ulid() : null);
  const setupRef = useRef(null);
  const punchlineRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  useEffect(() => {
    if (!isDirty) return;
    function handler(e) { e.preventDefault(); }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  function handleBack() {
    if (isDirty) setLeaveConfirm(true);
    else navigate('/jokes');
  }

  useEffect(() => {
    if (!isNew) {
      const joke = jokes.find(j => j.id === id);
      if (joke) {
        setForm({
          setup: joke.setup || '',
          punchline: joke.punchline || '',
          stage: (joke.stage && joke.stage !== 'idea') ? joke.stage : 'draft',
          duration_seconds: joke.duration_seconds || '',
          notes: joke.notes || '',
          tags: joke.tags || [],
          callback_to: joke.callback_to || '',
          audio_url: joke.audio_url || null,
        });
        if (joke.notes || joke.duration_seconds || joke.callback_to) {
          setShowDetails(true);
        }
      }
    }
  }, [id, jokes, isNew]);

  useEffect(() => {
    autoResize(setupRef);
    autoResize(punchlineRef);
  }, [form.setup, form.punchline]);

  function autoResize(ref) {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }

  function set(field, value) {
    setIsDirty(true);
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  }

  function removeTag(t) {
    set('tags', form.tags.filter(x => x !== t));
  }

  async function handleSave() {
    if (!form.setup.trim()) return toast.error('Add a setup first');
    setSaving(true);
    try {
      const data = {
        ...form,
        duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : null,
        callback_to: form.callback_to || null,
      };
      if (isNew) {
        await create({ ...data, id: pendingIdRef.current });
      } else {
        await update(id, data);
      }
      setIsDirty(false);
      toast.success('Saved');
      navigate('/jokes');
    } catch {
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await remove(id);
      const affected = sets.filter(s => (s.joke_ids || []).includes(id));
      await Promise.all(affected.map(s =>
        updateSet(s.id, { ...s, joke_ids: s.joke_ids.filter(jid => jid !== id) })
      ));
      setIsDirty(false);
      toast.success('Deleted');
      navigate('/jokes');
    } catch {
      toast.error("Couldn't delete");
      setDeleteLoading(false);
    }
  }

  if (!isNew && jokesLoading) return <JokeEditSkeleton />;

  const otherJokes = jokes.filter(j => j.id !== id);

  return (
    <Page>
      <PageHeader
        title={isNew ? 'New Joke' : 'Edit Joke'}
        onBack={handleBack}
        actions={!isNew && (
          <Button $variant="danger" $size="sm" onClick={() => setDeleting(true)}>Delete</Button>
        )}
      />
      <Body>
        <WritingArea>
          <BitTextarea
            ref={setupRef}
            $large
            placeholder="Setup..."
            value={form.setup}
            rows={3}
            onChange={e => { set('setup', e.target.value); autoResize(setupRef); }}
          />
          <Divider />
          <BitTextarea
            ref={punchlineRef}
            placeholder="Punchline..."
            value={form.punchline}
            rows={2}
            onChange={e => { set('punchline', e.target.value); autoResize(punchlineRef); }}
          />
        </WritingArea>

        <StageRow>
          {STAGES.map(s => (
            <StageBtn
              key={s}
              type="button"
              $active={form.stage === s}
              $stage={s}
              onClick={() => set('stage', s)}
            >
              {s}
            </StageBtn>
          ))}
        </StageRow>

        <TagArea>
          {form.tags.map(t => (
            <TagChip key={t}>#{t}<button type="button" onClick={() => removeTag(t)}><X size={11} strokeWidth={2.5} /></button></TagChip>
          ))}
          <TagInput
            placeholder="#tag"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } if (e.key === ',' || e.key === ' ') { e.preventDefault(); addTag(); } }}
            onBlur={addTag}
          />
        </TagArea>

        <AudioRecorder
          jokeId={isNew ? pendingIdRef.current : id}
          audioUrl={form.audio_url}
          onChange={url => set('audio_url', url)}
          onDuration={secs => set('duration_seconds', secs)}
        />

        <DetailsToggle type="button" onClick={() => setShowDetails(v => !v)}>
          {showDetails ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
          Details
        </DetailsToggle>

        {showDetails && (
          <DetailsPanel>
            <FormGroup>
              <Label>Notes</Label>
              <NoteTextarea
                placeholder="Crowd reactions, variations, things to try..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
              />
            </FormGroup>

            <FormGroup>
              <Label>Duration (seconds)</Label>
              <InlineInput
                type="number"
                placeholder="e.g. 60"
                value={form.duration_seconds}
                onChange={e => set('duration_seconds', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Callback to</Label>
              <Select value={form.callback_to} onChange={e => set('callback_to', e.target.value)}>
                <option value="">None</option>
                {otherJokes.map(j => (
                  <option key={j.id} value={j.id}>{j.setup?.slice(0, 60) || 'Untitled'}</option>
                ))}
              </Select>
            </FormGroup>
          </DetailsPanel>
        )}

        <SaveRow>
          <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving...' : isNew ? 'Save Joke' : 'Save'}
          </Button>
        </SaveRow>
      </Body>

      {deleting && (
        <ConfirmModal
          title="Delete joke?"
          message="This will remove the joke and any callback links."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(false)}
          loading={deleteLoading}
        />
      )}

      {leaveConfirm && (
        <ConfirmModal
          title="Discard changes?"
          message="You have unsaved changes that will be lost."
          confirmLabel="Leave"
          dangerous={false}
          onConfirm={() => { setIsDirty(false); navigate('/jokes'); }}
          onCancel={() => setLeaveConfirm(false)}
        />
      )}
    </Page>
  );
}
