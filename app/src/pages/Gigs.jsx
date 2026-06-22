import { useState, useEffect } from 'react';
import { ulid } from 'ulid';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { Plus, X, Users, FileText, ThumbsUp, Minus, Bomb } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { Input, Textarea, Select, Label, FormGroup } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ConfirmModal from '../components/ui/ConfirmModal';
import { GigsPageSkeleton } from '../components/ui/Skeleton';
import { REACTION_COLORS } from '../components/ReactionWidget';

const RATES = [
  { value: 1, icon: ThumbsUp, label: 'Killed' },
  { value: 0, icon: Minus, label: 'Flat' },
  { value: -1, icon: Bomb, label: 'Bombed' },
];

const fadeUp = keyframes`
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

const FormCard = styled(Card)`
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const FormCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const FormCardTitle = styled.div`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textMuted};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 1rem;

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const SaveRow = styled.div`
  margin-top: 0.75rem;
`;

const GigCard = styled(Card)`
  position: relative;
  margin-bottom: 0.75rem;
  padding: 0.875rem 3rem 0.875rem 1rem;
  cursor: pointer;
  animation: ${fadeUp} 0.2s ease both;
  animation-delay: ${({ $i }) => Math.min($i * 40, 240)}ms;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadow};
  }
`;

const GigDate = styled.div`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 0.25rem;
`;

const GigVenue = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.375rem;
`;

const GigMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const GigMetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.68rem;
  color: ${({ theme }) => theme.textMuted};
`;

const GigNotes = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.375rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RatingsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 0.5rem;
`;

const RatingDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const DeleteBtn = styled(Button)`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;

  @media (pointer: fine) {
    opacity: 0;
    transition: opacity 0.15s;
    ${GigCard}:hover & { opacity: 1; }
  }
`;

const JokeRatingSection = styled.div`
  margin-top: 0.25rem;
  border-top: 1px solid ${({ theme }) => theme.border};
  padding-top: 0.875rem;
`;

const JokeRatingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 0.5rem;
`;

const JokeRatingRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const JokeSetup = styled.div`
  font-size: 0.83rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const RateBtnRow = styled.div`
  display: flex;
  border-radius: ${({ theme }) => theme.radiusSm};
  overflow: hidden;
`;

const RateBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.4rem 0;
  border: 1px solid ${({ $active, $color, theme }) => $active ? $color : theme.border};
  border-left: none;
  background: ${({ $active, $bg }) => $active ? $bg : 'transparent'};
  color: ${({ $active, $color, theme }) => $active ? $color : theme.textMuted};
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &:first-child {
    border-left: 1px solid ${({ $active, $color, theme }) => $active ? $color : theme.border};
    border-radius: ${({ theme }) => theme.radiusSm} 0 0 ${({ theme }) => theme.radiusSm};
  }

  &:last-child {
    border-radius: 0 ${({ theme }) => theme.radiusSm} ${({ theme }) => theme.radiusSm} 0;
  }

  &:hover:not(:disabled) {
    color: ${({ $color }) => $color};
    border-color: ${({ $color }) => $color};
    position: relative;
    z-index: 1;
  }
`;

function formatGigDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = { date: todayIso(), venue: '', setId: '', audienceSize: '', notes: '', ratings: {} };

export default function Gigs() {
  const { items: gigs, loading: gigsLoading, create, update, remove } = useResource('gigs');
  const { items: sets, loading: setsLoading } = useResource('sets');
  const { items: jokes, loading: jokesLoading } = useResource('jokes');
  const { items: reactions, create: createReaction, remove: removeReaction } = useResource('reactions');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingGigId, setEditingGigId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { document.title = 'Gigs | My Tight Five'; }, []);

  if (gigsLoading || setsLoading || jokesLoading) return <GigsPageSkeleton />;

  const sortedGigs = [...gigs].sort((a, b) =>
    (b.date || '').localeCompare(a.date || '') || (b.created_at || '').localeCompare(a.created_at || '')
  );

  const setMap = {};
  sets.forEach(s => { setMap[s.id] = s; });

  const jokeMap = {};
  jokes.forEach(j => { jokeMap[j.id] = j; });

  // Most recent rating per joke per gig (reactions sorted desc by created_at)
  const gigReactionsMap = {};
  reactions.forEach(r => {
    if (!r.gigId) return;
    if (!gigReactionsMap[r.gigId]) gigReactionsMap[r.gigId] = {};
    if (!(r.jokeId in gigReactionsMap[r.gigId])) {
      gigReactionsMap[r.gigId][r.jokeId] = r.rating;
    }
  });

  function field(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function fieldEdit(key, value) {
    setEditForm(prev => ({ ...prev, [key]: value }));
  }

  function openForm() {
    setEditingGigId(null);
    setForm({ ...EMPTY_FORM, date: todayIso() });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function openEdit(gig) {
    setShowForm(false);
    const gigRatings = {};
    reactions
      .filter(r => r.gigId === gig.id)
      .forEach(r => { if (!(r.jokeId in gigRatings)) gigRatings[r.jokeId] = r.rating; });
    setEditForm({
      date: gig.date || '',
      venue: gig.venue || '',
      setId: gig.setId || '',
      audienceSize: gig.audienceSize != null ? String(gig.audienceSize) : '',
      notes: gig.notes || '',
      ratings: gigRatings,
    });
    setEditingGigId(gig.id);
  }

  function closeEdit() {
    setEditingGigId(null);
  }

  function setRating(jokeId, rating, isEdit) {
    if (isEdit) {
      setEditForm(prev => ({ ...prev, ratings: { ...prev.ratings, [jokeId]: rating } }));
    } else {
      setForm(prev => ({ ...prev, ratings: { ...prev.ratings, [jokeId]: rating } }));
    }
  }

  function renderJokeRatings(selectedSetId, ratingsMap, isEdit) {
    const selectedSet = selectedSetId ? setMap[selectedSetId] : null;
    const setJokes = (selectedSet?.joke_ids || []).map(jid => jokeMap[jid]).filter(Boolean);
    if (!setJokes.length) return null;
    return (
      <JokeRatingSection>
        <Label>How did each joke go?</Label>
        <JokeRatingList>
          {setJokes.map(joke => {
            const active = ratingsMap[joke.id];
            return (
              <JokeRatingRow key={joke.id}>
                <JokeSetup>{joke.setup || 'Untitled'}</JokeSetup>
                <RateBtnRow>
                  {RATES.map(({ value, icon: Icon, label }) => {
                    const color = REACTION_COLORS[String(value)];
                    const isActive = active === value;
                    return (
                      <RateBtn
                        key={value}
                        type="button"
                        $color={color}
                        $bg={`${color}22`}
                        $active={isActive}
                        onClick={() => setRating(joke.id, value, isEdit)}
                      >
                        <Icon size={12} strokeWidth={2} />
                        {label}
                      </RateBtn>
                    );
                  })}
                </RateBtnRow>
              </JokeRatingRow>
            );
          })}
        </JokeRatingList>
      </JokeRatingSection>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.venue.trim()) return toast.error('Venue is required');
    if (!form.date) return toast.error('Date is required');
    setSaving(true);
    try {
      const gigId = ulid();
      await create({
        id: gigId,
        date: form.date,
        venue: form.venue.trim(),
        setId: form.setId || null,
        audienceSize: form.audienceSize ? parseInt(form.audienceSize, 10) : null,
        notes: form.notes.trim() || null,
      });
      const ratingEntries = Object.entries(form.ratings);
      if (ratingEntries.length > 0) {
        await Promise.all(ratingEntries.map(([jokeId, rating]) =>
          createReaction({ jokeId, gigId, rating })
        ));
      }
      closeForm();
      toast.success('Gig logged');
    } catch {
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editForm.venue.trim()) return toast.error('Venue is required');
    if (!editForm.date) return toast.error('Date is required');
    setUpdating(true);
    try {
      await update(editingGigId, {
        date: editForm.date,
        venue: editForm.venue.trim(),
        setId: editForm.setId || null,
        audienceSize: editForm.audienceSize ? parseInt(editForm.audienceSize, 10) : null,
        notes: editForm.notes.trim() || null,
      });
      const oldReactions = reactions.filter(r => r.gigId === editingGigId);
      await Promise.all(oldReactions.map(r => removeReaction(r.id)));
      const ratingEntries = Object.entries(editForm.ratings);
      if (ratingEntries.length > 0) {
        await Promise.all(ratingEntries.map(([jokeId, rating]) =>
          createReaction({ jokeId, gigId: editingGigId, rating })
        ));
      }
      closeEdit();
      toast.success('Gig updated');
    } catch {
      toast.error("Couldn't update");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const gigReactions = reactions.filter(r => r.gigId === deleting);
      await Promise.all(gigReactions.map(r => removeReaction(r.id)));
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
        title="Gigs"
        back="/"
        actions={
          <Button $size="sm" onClick={showForm ? closeForm : openForm}>
            {showForm ? <X size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
            {showForm ? 'Cancel' : 'Log Gig'}
          </Button>
        }
      />

      <Body>
        {showForm && (
          <FormCard as="form" onSubmit={handleSave}>
            <FormRow>
              <FormGroup>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => field('date', e.target.value)} required />
              </FormGroup>
              <FormGroup>
                <Label>Audience Size</Label>
                <Input type="number" placeholder="e.g. 50" min={0} value={form.audienceSize} onChange={e => field('audienceSize', e.target.value)} />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>Venue</Label>
              <Input placeholder="Where did you perform?" value={form.venue} onChange={e => field('venue', e.target.value)} required />
            </FormGroup>

            <FormGroup>
              <Label>Set</Label>
              <Select value={form.setId} onChange={e => field('setId', e.target.value)}>
                <option value="">No set</option>
                {sets.map(s => <option key={s.id} value={s.id}>{s.name || 'Untitled'}</option>)}
              </Select>
            </FormGroup>

            <FormGroup style={{ marginBottom: 0 }}>
              <Label>Notes</Label>
              <Textarea placeholder="How did it go?" value={form.notes} onChange={e => field('notes', e.target.value)} rows={3} />
            </FormGroup>

            {renderJokeRatings(form.setId, form.ratings, false)}

            <SaveRow>
              <Button type="submit" $loading={saving} disabled={saving} style={{ width: '100%' }}>
                Log Gig
              </Button>
            </SaveRow>
          </FormCard>
        )}

        {sortedGigs.length === 0 && !showForm ? (
          <EmptyState message="No gigs logged yet." />
        ) : (
          sortedGigs.map((gig, i) => {
            const linkedSet = gig.setId ? setMap[gig.setId] : null;
            const gigRatings = gigReactionsMap[gig.id] || {};
            const ratedDots = (linkedSet?.joke_ids || []).filter(jid => jid in gigRatings);

            if (editingGigId === gig.id) {
              return (
                <FormCard key={gig.id} as="form" onSubmit={handleUpdate}>
                  <FormCardHeader>
                    <FormCardTitle>Edit Gig</FormCardTitle>
                    <Button type="button" $variant="ghost" $size="sm" onClick={closeEdit}>
                      <X size={14} strokeWidth={2} /> Cancel
                    </Button>
                  </FormCardHeader>

                  <FormRow>
                    <FormGroup>
                      <Label>Date</Label>
                      <Input type="date" value={editForm.date} onChange={e => fieldEdit('date', e.target.value)} required />
                    </FormGroup>
                    <FormGroup>
                      <Label>Audience Size</Label>
                      <Input type="number" placeholder="e.g. 50" min={0} value={editForm.audienceSize} onChange={e => fieldEdit('audienceSize', e.target.value)} />
                    </FormGroup>
                  </FormRow>

                  <FormGroup>
                    <Label>Venue</Label>
                    <Input placeholder="Where did you perform?" value={editForm.venue} onChange={e => fieldEdit('venue', e.target.value)} required />
                  </FormGroup>

                  <FormGroup>
                    <Label>Set</Label>
                    <Select value={editForm.setId} onChange={e => fieldEdit('setId', e.target.value)}>
                      <option value="">No set</option>
                      {sets.map(s => <option key={s.id} value={s.id}>{s.name || 'Untitled'}</option>)}
                    </Select>
                  </FormGroup>

                  <FormGroup style={{ marginBottom: 0 }}>
                    <Label>Notes</Label>
                    <Textarea placeholder="How did it go?" value={editForm.notes} onChange={e => fieldEdit('notes', e.target.value)} rows={3} />
                  </FormGroup>

                  {renderJokeRatings(editForm.setId, editForm.ratings, true)}

                  <SaveRow>
                    <Button type="submit" $loading={updating} disabled={updating} style={{ width: '100%' }}>
                      Save Changes
                    </Button>
                  </SaveRow>
                </FormCard>
              );
            }

            return (
              <GigCard key={gig.id} $i={i} onClick={() => openEdit(gig)}>
                <GigDate>{formatGigDate(gig.date)}</GigDate>
                <GigVenue>{gig.venue}</GigVenue>
                <GigMeta>
                  {linkedSet && (
                    <GigMetaItem>
                      <FileText size={11} strokeWidth={2} />
                      {linkedSet.name || 'Untitled'}
                    </GigMetaItem>
                  )}
                  {gig.audienceSize != null && (
                    <GigMetaItem>
                      <Users size={11} strokeWidth={2} />
                      {gig.audienceSize}
                    </GigMetaItem>
                  )}
                </GigMeta>
                {gig.notes && <GigNotes>{gig.notes}</GigNotes>}
                {ratedDots.length > 0 && (
                  <RatingsRow>
                    {ratedDots.map(jid => (
                      <RatingDot key={jid} $color={REACTION_COLORS[String(gigRatings[jid])]} />
                    ))}
                  </RatingsRow>
                )}
                <DeleteBtn
                  $variant="ghost"
                  $size="sm"
                  onClick={e => { e.stopPropagation(); setDeleting(gig.id); }}
                  aria-label="Delete gig"
                >
                  <X size={14} strokeWidth={2} />
                </DeleteBtn>
              </GigCard>
            );
          })
        )}
      </Body>

      {deleting && (
        <ConfirmModal
          title="Delete gig?"
          message="This can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </Page>
  );
}
