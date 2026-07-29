import { useState, useEffect, useRef } from 'react';
import { ulid } from 'ulid';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { Plus, X, Users, FileText, ThumbsUp, Minus, Bomb, Video } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { getVideoUploadUrl, deleteVideoFile } from '../utils/api';
import { Input, Textarea, Select, Label, FormGroup } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ConfirmModal from '../components/ui/ConfirmModal';
import VideoModal from '../components/ui/VideoModal';
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

const WatchBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.primary};
  background: ${({ theme }) => theme.primaryLight};
  border: 1px solid ${({ theme }) => theme.primary};
  padding: 0.1875rem 0.5rem;
  border-radius: 99px;
  transition: opacity 0.15s;
  margin-left: auto;

  &:hover { opacity: 0.8; }
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
  border: 1px solid ${({ theme }) => theme.border};
  border-left: none;
  background: ${({ $active, $bg }) => $active ? $bg : 'transparent'};
  color: ${({ $active, $color, theme }) => $active ? $color : theme.textMuted};
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:first-child {
    border-left: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radiusSm} 0 0 ${({ theme }) => theme.radiusSm};
  }

  &:last-child {
    border-radius: 0 ${({ theme }) => theme.radiusSm} ${({ theme }) => theme.radiusSm} 0;
  }

  &:hover:not(:disabled) {
    color: ${({ $color }) => $color};
    background: ${({ $bg }) => $bg};
  }
`;

const VideoUploadLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover { border-color: ${({ theme }) => theme.primary}; color: ${({ theme }) => theme.text}; }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const VideoProgressWrap = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
`;

const VideoProgressBar = styled.div`
  height: 4px;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  margin-top: 0.375rem;
  overflow: hidden;
`;

const VideoProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme }) => theme.primary};
  border-radius: 2px;
  transition: width 0.2s ease;
`;

const VideoAttached = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const VideoPreviewWrap = styled.div`
  position: relative;
`;

const RemoveVideoBtn = styled(Button)`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
`;

const VideoAttachedChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.text};
  padding: 0.5rem 0.625rem;
  padding-right: 2.5rem;
  background: ${({ theme }) => theme.bgInput};
  border-radius: ${({ theme }) => theme.radiusSm};
`;

const GigVideoPlayer = styled.video`
  width: 100%;
  max-height: 200px;
  border-radius: ${({ theme }) => theme.radiusSm};
  background: #000;
  display: block;
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

const EMPTY_FORM = { date: todayIso(), venue: '', setId: '', audienceSize: '', notes: '', video_url: null, ratings: {} };

const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024;

function videoKey(url) {
  if (!url) return null;
  if (url.startsWith('video/')) return url;
  try { return new URL(url).pathname.slice(1); } catch { return null; }
}

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
  const [watchingUrl, setWatchingUrl] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoLocalUrl, setVideoLocalUrl] = useState(null);
  const newGigIdRef = useRef(ulid());
  const videoLocalUrlRef = useRef(null);

  useEffect(() => { document.title = 'Gigs | My Tight Five'; }, []);

  useEffect(() => { videoLocalUrlRef.current = videoLocalUrl; }, [videoLocalUrl]);
  useEffect(() => () => { if (videoLocalUrlRef.current) URL.revokeObjectURL(videoLocalUrlRef.current); }, []);

  function clearVideoLocalPreview() {
    if (videoLocalUrlRef.current) URL.revokeObjectURL(videoLocalUrlRef.current);
    setVideoLocalUrl(null);
  }

  if (gigsLoading || setsLoading || jokesLoading) return <GigsPageSkeleton />;

  const sortedGigs = [...gigs].sort((a, b) =>
    (b.date || '').localeCompare(a.date || '') || (b.created_at || '').localeCompare(a.created_at || '')
  );

  const setMap = {};
  sets.forEach(s => { setMap[s.id] = s; });

  const jokeMap = {};
  jokes.forEach(j => { jokeMap[j.id] = j; });

  function field(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function fieldEdit(key, value) {
    setEditForm(prev => ({ ...prev, [key]: value }));
  }

  function openForm() {
    setEditingGigId(null);
    setForm({ ...EMPTY_FORM, date: todayIso() });
    newGigIdRef.current = ulid();
    clearVideoLocalPreview();
    setShowForm(true);
  }

  function closeForm() {
    clearVideoLocalPreview();
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
      video_url: gig.video_url || null,
      ratings: gigRatings,
    });
    clearVideoLocalPreview();
    setEditingGigId(gig.id);

    if (gig.setId && (!gig.setJokeIds || !gig.setName)) {
      const selectedSet = setMap[gig.setId];
      if (selectedSet) {
        update(gig.id, { ...gig, setJokeIds: selectedSet.joke_ids || [], setName: selectedSet.name || null }).catch(() => {});
      }
    }
  }

  function closeEdit() {
    clearVideoLocalPreview();
    setEditingGigId(null);
  }

  function setRating(jokeId, rating, isEdit) {
    const updateRatings = ratings => {
      if (ratings[jokeId] === rating) {
        const { [jokeId]: _omit, ...rest } = ratings;
        return rest;
      }
      return { ...ratings, [jokeId]: rating };
    };
    if (isEdit) {
      setEditForm(prev => ({ ...prev, ratings: updateRatings(prev.ratings) }));
    } else {
      setForm(prev => ({ ...prev, ratings: updateRatings(prev.ratings) }));
    }
  }

  async function handleVideoSelect(e, isEdit) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE) return toast.error('File is too large. Maximum size is 2 GB.');

    clearVideoLocalPreview();
    setVideoLocalUrl(URL.createObjectURL(file));

    const gigId = isEdit ? editingGigId : newGigIdRef.current;
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const { uploadUrl, videoUrl } = await getVideoUploadUrl(gigId, file.type);
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) setVideoProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });
      if (isEdit) fieldEdit('video_url', videoUrl); else field('video_url', videoUrl);
      toast.success('Video uploaded');
    } catch {
      toast.error("Couldn't upload video");
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
    }
  }

  function handleRemoveVideo(isEdit) {
    const gigId = isEdit ? editingGigId : newGigIdRef.current;
    clearVideoLocalPreview();
    if (isEdit) fieldEdit('video_url', null); else field('video_url', null);
    deleteVideoFile(gigId).catch(() => {});
  }

  function renderJokeRatings(jokeIds, ratingsMap, isEdit) {
    const setJokes = (jokeIds || []).map(jid => jokeMap[jid]).filter(Boolean);
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

  function renderVideoField(isEdit) {
    const url = isEdit ? editForm.video_url : form.video_url;
    const previewSrc = videoLocalUrl || (url && url.startsWith('https://') ? url : null);
    return (
      <FormGroup>
        <Label>Video (optional)</Label>
        {url || videoLocalUrl ? (
          <VideoAttached>
            <VideoPreviewWrap>
              {previewSrc ? (
                <GigVideoPlayer src={previewSrc} controls preload="metadata" />
              ) : (
                <VideoAttachedChip><Video size={14} strokeWidth={2} />Video attached</VideoAttachedChip>
              )}
              <RemoveVideoBtn
                type="button"
                $variant="ghost"
                $size="sm"
                disabled={videoUploading}
                onClick={() => handleRemoveVideo(isEdit)}
                aria-label="Remove video"
              >
                <X size={14} strokeWidth={2} />
              </RemoveVideoBtn>
            </VideoPreviewWrap>
            {videoUploading && (
              <VideoProgressWrap>
                Uploading… {videoProgress}%
                <VideoProgressBar><VideoProgressFill $pct={videoProgress} /></VideoProgressBar>
              </VideoProgressWrap>
            )}
          </VideoAttached>
        ) : (
          <VideoUploadLabel>
            <Video size={16} strokeWidth={2} />
            Add video
            <HiddenFileInput type="file" accept="video/*" onChange={e => handleVideoSelect(e, isEdit)} />
          </VideoUploadLabel>
        )}
      </FormGroup>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.venue.trim()) return toast.error('Venue is required');
    if (!form.date) return toast.error('Date is required');
    setSaving(true);
    try {
      const gigId = newGigIdRef.current;
      const selectedSet = form.setId ? setMap[form.setId] : null;
      await create({
        id: gigId,
        date: form.date,
        venue: form.venue.trim(),
        setId: form.setId || null,
        setJokeIds: selectedSet?.joke_ids || [],
        setName: selectedSet?.name || null,
        audienceSize: form.audienceSize ? parseInt(form.audienceSize, 10) : null,
        notes: form.notes.trim() || null,
        video_url: videoKey(form.video_url),
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
      const editingGig = gigs.find(g => g.id === editingGigId);
      const setChanged = editForm.setId !== (editingGig?.setId || '');
      const selectedSet = editForm.setId ? setMap[editForm.setId] : null;
      const setJokeIds = (setChanged || !editingGig?.setJokeIds) ? (selectedSet?.joke_ids || []) : editingGig.setJokeIds;
      const setName = (setChanged || !editingGig?.setName) ? (selectedSet?.name || null) : editingGig.setName;
      await update(editingGigId, {
        date: editForm.date,
        venue: editForm.venue.trim(),
        setId: editForm.setId || null,
        setJokeIds,
        setName,
        audienceSize: editForm.audienceSize ? parseInt(editForm.audienceSize, 10) : null,
        notes: editForm.notes.trim() || null,
        video_url: videoKey(editForm.video_url),
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

            <FormGroup>
              <Label>Notes</Label>
              <Textarea placeholder="How did it go?" value={form.notes} onChange={e => field('notes', e.target.value)} rows={3} />
            </FormGroup>

            {renderVideoField(false)}

            {renderJokeRatings(form.setId ? (setMap[form.setId]?.joke_ids || []) : [], form.ratings, false)}

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

                  <FormGroup>
                    <Label>Notes</Label>
                    <Textarea placeholder="How did it go?" value={editForm.notes} onChange={e => fieldEdit('notes', e.target.value)} rows={3} />
                  </FormGroup>

                  {renderVideoField(true)}

                  {renderJokeRatings(
                    editForm.setId !== (gig.setId || '')
                      ? (setMap[editForm.setId]?.joke_ids || [])
                      : (gig.setJokeIds || setMap[editForm.setId]?.joke_ids || []),
                    editForm.ratings,
                    true
                  )}

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
                  {(gig.setName || linkedSet) && (
                    <GigMetaItem>
                      <FileText size={11} strokeWidth={2} />
                      {gig.setName || linkedSet?.name || 'Untitled'}
                    </GigMetaItem>
                  )}
                  {gig.audienceSize != null && (
                    <GigMetaItem>
                      <Users size={11} strokeWidth={2} />
                      {gig.audienceSize}
                    </GigMetaItem>
                  )}
                  {gig.video_url && (
                    <WatchBtn type="button" onClick={e => { e.stopPropagation(); setWatchingUrl(gig.video_url); }}>
                      <Video size={11} strokeWidth={2} />
                      Watch
                    </WatchBtn>
                  )}
                </GigMeta>
                {gig.notes && <GigNotes>{gig.notes}</GigNotes>}
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

      {watchingUrl && (
        <VideoModal url={watchingUrl} onClose={() => setWatchingUrl(null)} />
      )}
    </Page>
  );
}
