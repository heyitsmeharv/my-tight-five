import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { X, Plus, CornerDownLeft } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import StageBadge from '../components/ui/StageBadge';
import ConfirmModal from '../components/ui/ConfirmModal';
import EmptyState, { EmptyAction } from '../components/ui/EmptyState';
import { JokesPageSkeleton } from '../components/ui/Skeleton';
import InlinePlayer from '../components/ui/InlinePlayer';
import { formatDuration } from '../utils/time';
import { STAGE_COLOR } from '../utils/stages';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
`;

const Page = styled.div`
  padding-bottom: 80px;
  max-width: 600px;
  margin: 0 auto;
`;

const Filters = styled.div`
  padding: 10px 16px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const FilterBtn = styled.button`
  padding: 4px 12px;
  border-radius: 99px;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  border: 1px solid ${({ $active, theme }) => $active ? theme.primary : theme.border};
  background: ${({ $active, theme }) => $active ? theme.primaryLight : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.primary : theme.textMuted};
  min-height: 30px;
  cursor: pointer;
  transition: all 0.15s;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
`;

const JokeCard = styled.div`
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-left: 4px solid ${({ $color }) => $color ?? 'transparent'};
  border-radius: ${({ theme }) => theme.radius};
  padding: 14px 46px 14px 16px;
  cursor: pointer;
  position: relative;
  animation: ${fadeUp} 0.2s ease both;
  animation-delay: ${({ $i }) => Math.min($i * 40, 300)}ms;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: ${({ $color }) => $color};
    box-shadow: ${({ theme }) => theme.shadow};
  }
`;

const CardSetup = styled.p`
  font-size: 0.95rem;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 5px;
`;

const CardPunchline = styled.p`
  font-size: 0.83rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  color: ${({ theme }) => theme.textMuted};
  font-style: italic;
  margin-bottom: 6px;
`;

const CardNotes = styled.p`
  font-size: 0.78rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 2px solid ${({ theme }) => theme.border};
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const CardDuration = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.68rem;
  color: ${({ theme }) => theme.textMuted};
`;


const CallbackLink = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  text-align: left;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.65rem;
  color: ${({ theme }) => theme.textMuted};
  opacity: 0.65;
  margin-bottom: 0.5rem;
  padding: 0.45rem 0;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: color 0.15s, opacity 0.15s;

  &:hover {
    opacity: 1;
    color: ${({ theme }) => theme.primary};
  }
`;

const TagRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const Spacer = styled.div`flex: 1;`;

const Tag = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.62rem;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  background: ${({ theme }) => theme.primaryLight};
  border-radius: 99px;
  padding: 2px 7px;
`;

const DeleteBtn = styled(Button)`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;

  @media (pointer: fine) {
    opacity: 0;
    transition: opacity 0.15s;
    ${JokeCard}:hover & { opacity: 1; }
  }
`;


const STAGE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'tested', label: 'Tested' },
  { value: 'polished', label: 'Polished' },
];


export default function Jokes() {
  const navigate = useNavigate();
  const { items: jokes, loading, remove } = useResource('jokes');
  const { items: sets, update: updateSet } = useResource('sets');
  const [stage, setStage] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { document.title = 'Jokes | My Tight Five'; }, []);

  if (loading) return <JokesPageSkeleton />;

  const filtered = stage === 'all' ? jokes : jokes.filter(j => (j.stage || 'draft') === stage);

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await remove(deleting);
      const affected = sets.filter(s => (s.joke_ids || []).includes(deleting));
      await Promise.all(affected.map(s =>
        updateSet(s.id, { ...s, joke_ids: s.joke_ids.filter(id => id !== deleting) })
      ));
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
        title="Jokes"
        back="/"
        actions={<Button $size="sm" onClick={() => navigate('/jokes/new')}><Plus size={14} strokeWidth={2} />New</Button>}
      />

      <Filters>
        {STAGE_FILTERS.map(({ value, label }) => (
          <FilterBtn key={value} $active={stage === value} onClick={() => setStage(value)}>
            {label}
          </FilterBtn>
        ))}
      </Filters>

      {filtered.length === 0 ? (
        stage === 'all'
          ? <EmptyState>
              <EmptyAction type="button" onClick={() => navigate('/jokes/new')}>Write a joke</EmptyAction>
            </EmptyState>
          : <EmptyState message={`No ${STAGE_FILTERS.find(f => f.value === stage)?.label.toLowerCase() ?? stage} jokes.`} />
      ) : (
        <Stack>
          {filtered.map((joke, i) => {
            const stageKey = joke.stage || 'draft';
            const color = STAGE_COLOR[stageKey]?.color;
            const tags = joke.tags?.slice(0, 4) ?? [];
            const callbackJoke = joke.callback_to ? jokes.find(j => j.id === joke.callback_to) : null;

            return (
              <JokeCard key={joke.id} $i={i} $color={color} onClick={() => navigate(`/jokes/${joke.id}`)}>
                <CardSetup>{joke.setup || 'Untitled'}</CardSetup>

                {joke.punchline && (
                  <CardPunchline>{joke.punchline}</CardPunchline>
                )}

                {joke.notes && (
                  <CardNotes>{joke.notes}</CardNotes>
                )}

                {joke.callback_to && (
                  <CallbackLink
                    title={callbackJoke?.setup || 'Jump to callback joke'}
                    onClick={e => { e.stopPropagation(); navigate(`/jokes/${joke.callback_to}`); }}
                  >
                    <CornerDownLeft size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
                    {callbackJoke?.setup ?? '—'}
                  </CallbackLink>
                )}

                <CardFooter>
                  <StageBadge stage={stageKey} />
                  {joke.duration_seconds > 0 && (
                    <CardDuration>{formatDuration(joke.duration_seconds)}</CardDuration>
                  )}
                  {tags.length > 0 && (
                    <TagRow>
                      {tags.map(t => <Tag key={t}>#{t}</Tag>)}
                    </TagRow>
                  )}
                  {joke.audio_url && <Spacer />}
                  {joke.audio_url && <InlinePlayer url={joke.audio_url} />}
                </CardFooter>

                <DeleteBtn $variant="ghost" $size="sm" onClick={e => { e.stopPropagation(); setDeleting(joke.id); }} aria-label="Delete joke">
                  <X size={14} strokeWidth={2} />
                </DeleteBtn>
              </JokeCard>
            );
          })}
        </Stack>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete joke?"
          message="This will remove the joke and any callback links to it."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </Page>
  );
}
