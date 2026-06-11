import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { X, Plus, CornerDownLeft, ChevronDown } from 'lucide-react';
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
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 600px;
  margin: 0 auto;
  min-width: 0;
  overflow: hidden;
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 5rem;

  @media (min-width: 768px) {
    padding-bottom: 1rem;
  }
`;

const Filters = styled.div`
  padding: 0.625rem 1rem;
  display: flex;
  gap: 0.375rem;
  overflow-x: auto;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  -webkit-overflow-scrolling: touch;
`;

const FilterBtn = styled.button`
  padding: 0.25rem 0.75rem;
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
  min-height: 1.875rem;
  cursor: pointer;
  transition: all 0.15s;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.75rem 1rem;

  @media (max-width: 400px) {
    padding: 0.625rem 0.75rem;
  }
`;

const Thread = styled.div`
  display: flex;
  flex-direction: column;
`;

const ThreadChildren = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 0.625rem;
  margin-left: 1.375rem;
  padding-left: 1rem;
  border-left: 2px solid ${({ theme }) => theme.border};
`;

const JokeCard = styled.div`
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-left: 4px solid ${({ $color }) => $color ?? 'transparent'};
  border-radius: ${({ theme }) => theme.radius};
  padding: 0.875rem 2.875rem 0.875rem 1rem;
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
  margin-bottom: 0.3125rem;
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
  margin-bottom: 0.375rem;
`;

const CardNotes = styled.p`
  font-size: 0.78rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.625rem;
  padding-left: 0.5rem;
  border-left: 2px solid ${({ theme }) => theme.border};
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  gap: 0.3125rem;
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

const Spacer = styled.div`flex: 1;`;

const SectionLabel = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textMuted};
  padding: 0.875rem 0 0.5rem;
  transition: color 0.15s;

  &:hover { color: ${({ theme }) => theme.text}; }
`;

const SectionLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${({ theme }) => theme.border};
`;

const SectionCount = styled.span`
  font-size: 0.75rem;
  opacity: 0.5;
`;

const GroupCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 0.25rem;
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

const ThreadToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.secondary};
  background: ${({ theme }) => theme.accent};
  padding: 0.2rem 0.5rem;
  border-radius: 99px;
  transition: opacity 0.15s;
  flex-shrink: 0;

  svg {
    transition: transform 0.2s ease;
    transform: rotate(${({ $collapsed }) => $collapsed ? '-90deg' : '0deg'});
  }

  &:hover { opacity: 0.75; }
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
  const [collapsed, setCollapsed] = useState(new Set());

  function toggleCollapse(id, e) {
    e.stopPropagation();
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  function toggleGroup(cat) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  useEffect(() => { document.title = 'Jokes | My Tight Five'; }, []);

  if (loading) return <JokesPageSkeleton />;

  const filtered = stage === 'all' ? jokes : jokes.filter(j => (j.stage || 'draft') === stage);

  const filteredIds = new Set(filtered.map(j => j.id));
  const cbMap = {};
  filtered.forEach(j => {
    if (j.callback_to && filteredIds.has(j.callback_to)) {
      (cbMap[j.callback_to] = cbMap[j.callback_to] || []).push(j);
    }
  });
  const roots = filtered.filter(j => !j.callback_to || !filteredIds.has(j.callback_to));

  const groups = {};
  roots.forEach(joke => {
    const cat = joke.tags?.[0] || '';
    (groups[cat] = groups[cat] || []).push(joke);
  });

  function countTree(jokeId) {
    return 1 + (cbMap[jokeId] || []).reduce((sum, child) => sum + countTree(child.id), 0);
  }

  const catCounts = {};
  roots.forEach(joke => {
    const cat = joke.tags?.[0] || '';
    catCounts[cat] = (catCounts[cat] || 0) + countTree(joke.id);
  });

  const groupKeys = Object.keys(groups).sort((a, b) => {
    if (!a && b) return 1;
    if (a && !b) return -1;
    return a.localeCompare(b);
  });

  function renderNode(joke, depth, animI) {
    const stageKey = joke.stage || 'draft';
    const color = STAGE_COLOR[stageKey]?.color;
    const callbackJoke = joke.callback_to ? jokes.find(j => j.id === joke.callback_to) : null;
    const children = cbMap[joke.id] || [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsed.has(joke.id);

    return (
      <Thread key={joke.id}>
        <JokeCard $i={animI} $color={color} onClick={() => navigate(`/jokes/${joke.id}`)}>
          <CardSetup>{joke.setup || 'Untitled'}</CardSetup>
          {joke.punchline && <CardPunchline>{joke.punchline}</CardPunchline>}
          {joke.notes && <CardNotes>{joke.notes}</CardNotes>}
          {joke.callback_to && callbackJoke && (
            <CallbackLink
              title={callbackJoke.setup || 'Jump to callback joke'}
              onClick={e => { e.stopPropagation(); navigate(`/jokes/${joke.callback_to}`); }}
            >
              <CornerDownLeft size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
              {callbackJoke.setup || 'Untitled'}
            </CallbackLink>
          )}
          <CardFooter>
            <StageBadge stage={stageKey} />
            {joke.duration_seconds > 0 && <CardDuration>{formatDuration(joke.duration_seconds)}</CardDuration>}
            {(joke.audio_url || hasChildren) && <Spacer />}
            {joke.audio_url && <span onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}><InlinePlayer url={joke.audio_url} /></span>}
            {hasChildren && (
              <ThreadToggle $collapsed={isCollapsed} onClick={e => toggleCollapse(joke.id, e)}>
                {isCollapsed && children.length}
                <ChevronDown size={12} strokeWidth={2} />
              </ThreadToggle>
            )}
          </CardFooter>
          <DeleteBtn $variant="ghost" $size="sm" onClick={e => { e.stopPropagation(); setDeleting(joke.id); }} aria-label="Delete joke">
            <X size={14} strokeWidth={2} />
          </DeleteBtn>
        </JokeCard>
        {hasChildren && !isCollapsed && (
          <ThreadChildren>
            {children.map((child, ci) => renderNode(child, depth + 1, animI + ci + 1))}
          </ThreadChildren>
        )}
      </Thread>
    );
  }

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

      <ScrollArea>
        {filtered.length === 0 ? (
          stage === 'all'
            ? <EmptyState>
              <EmptyAction type="button" onClick={() => navigate('/jokes/new')}>Write a joke</EmptyAction>
            </EmptyState>
            : <EmptyState message={`No ${STAGE_FILTERS.find(f => f.value === stage)?.label.toLowerCase() ?? stage} jokes.`} />
        ) : (
          <Stack>
            {groupKeys.map(cat => {
              const groupJokes = groups[cat];
              const label = cat || 'Uncategorized';
              const isGroupCollapsed = collapsedGroups.has(cat);
              return (
                <div key={cat || '__none__'}>
                  <SectionLabel onClick={() => toggleGroup(cat)}>
                    <ChevronDown
                      size={11}
                      strokeWidth={2.5}
                      style={{
                        transform: isGroupCollapsed ? 'rotate(-90deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                    {label}
                    <SectionLine />
                    <SectionCount>{catCounts[cat] ?? groupJokes.length}</SectionCount>
                  </SectionLabel>
                  {!isGroupCollapsed && (
                    <GroupCards>
                      {groupJokes.map((joke, i) => renderNode(joke, 0, i))}
                    </GroupCards>
                  )}
                </div>
              );
            })}
          </Stack>
        )}
      </ScrollArea>

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
