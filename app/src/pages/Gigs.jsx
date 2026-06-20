import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { Plus, X, Users, FileText } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { Input, Textarea, Select, Label, FormGroup } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ConfirmModal from '../components/ui/ConfirmModal';
import { GigsPageSkeleton } from '../components/ui/Skeleton';

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
  animation: ${fadeUp} 0.2s ease both;
  animation-delay: ${({ $i }) => Math.min($i * 40, 240)}ms;
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

function formatGigDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = { date: todayIso(), venue: '', setId: '', audienceSize: '', notes: '' };

export default function Gigs() {
  const { items: gigs, loading: gigsLoading, create, remove } = useResource('gigs');
  const { items: sets, loading: setsLoading } = useResource('sets');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { document.title = 'Gigs | My Tight Five'; }, []);

  if (gigsLoading || setsLoading) return <GigsPageSkeleton />;

  const sortedGigs = [...gigs].sort((a, b) =>
    (b.date || '').localeCompare(a.date || '') || (b.created_at || '').localeCompare(a.created_at || '')
  );

  const setMap = {};
  sets.forEach(s => { setMap[s.id] = s; });

  function field(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function openForm() {
    setForm({ ...EMPTY_FORM, date: todayIso() });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.venue.trim()) return toast.error('Venue is required');
    if (!form.date) return toast.error('Date is required');
    setSaving(true);
    try {
      await create({
        date: form.date,
        venue: form.venue.trim(),
        setId: form.setId || null,
        audienceSize: form.audienceSize ? parseInt(form.audienceSize, 10) : null,
        notes: form.notes.trim() || null,
      });
      closeForm();
      toast.success('Gig logged');
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
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => field('date', e.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Audience Size</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  min={0}
                  value={form.audienceSize}
                  onChange={e => field('audienceSize', e.target.value)}
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>Venue</Label>
              <Input
                placeholder="Where did you perform?"
                value={form.venue}
                onChange={e => field('venue', e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Set</Label>
              <Select value={form.setId} onChange={e => field('setId', e.target.value)}>
                <option value="">No set</option>
                {sets.map(s => (
                  <option key={s.id} value={s.id}>{s.name || 'Untitled'}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup style={{ marginBottom: 0 }}>
              <Label>Notes</Label>
              <Textarea
                placeholder="How did it go? What landed, what flopped?"
                value={form.notes}
                onChange={e => field('notes', e.target.value)}
                rows={3}
              />
            </FormGroup>

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
            return (
              <GigCard key={gig.id} $i={i}>
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
                <DeleteBtn
                  $variant="ghost"
                  $size="sm"
                  onClick={() => setDeleting(gig.id)}
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
