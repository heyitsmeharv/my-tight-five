import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Plus, CornerDownLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useResource } from '../hooks/useResource';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import StageBadge from '../components/ui/StageBadge';
import InlinePlayer from '../components/ui/InlinePlayer';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { formatDuration, relativeTime } from '../utils/time';
import { post } from '../utils/api';
import { ulid } from 'ulid';
import { STAGE_COLOR } from '../utils/stages';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
`;

const Page = styled.div`
  padding: 24px 16px 80px;
  max-width: 600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 32px;

  @media (min-width: 768px) {
    display: none;
  }
`;

const AppTitle = styled.h1`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.primary};
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 4px;
`;

const QuickCapture = styled.form`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 36px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding-bottom: 4px;
  transition: border-color 0.15s;

  &:focus-within { border-color: ${({ theme }) => theme.primary}; }
`;

const QuickInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  padding: 8px 0;
  min-height: 40px;

  &:focus { outline: none; }
  &::placeholder { color: ${({ theme }) => theme.textMuted}; }
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: ${({ theme }) => theme.border};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  overflow: hidden;
  margin-bottom: 36px;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.bgCard};
  padding: 14px 10px;
  text-align: center;
`;

const StatValue = styled.div`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 1.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.accent};
  line-height: 1;
  min-height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatLabel = styled.div`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 4px;
`;

const Section = styled.div`
  margin-bottom: 28px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: ${({ theme }) => theme.textMuted};
`;

const RecentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RecentCard = styled(Link)`
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-left: 4px solid ${({ $color }) => $color ?? 'transparent'};
  border-radius: ${({ theme }) => theme.radius};
  padding: 12px 16px;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 5px;
  animation: ${fadeUp} 0.2s ease both;
  animation-delay: ${({ $i }) => Math.min($i * 40, 250)}ms;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: ${({ $color }) => $color ?? 'transparent'};
    box-shadow: ${({ theme }) => theme.shadow};
  }
`;

const RecentSetup = styled.p`
  font-size: 0.92rem;
  line-height: 1.45;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const RecentPunchline = styled.p`
  font-size: 0.82rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  color: ${({ theme }) => theme.textMuted};
  font-style: italic;
`;

const RecentNotes = styled.p`
  font-size: 0.76rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  color: ${({ theme }) => theme.textMuted};
  padding-left: 8px;
  border-left: 2px solid ${({ theme }) => theme.border};
`;

const RecentCallback = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  text-align: left;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.63rem;
  color: ${({ theme }) => theme.textMuted};
  opacity: 0.65;
  padding: 0.35rem 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: color 0.15s, opacity 0.15s;

  &:hover {
    opacity: 1;
    color: ${({ theme }) => theme.primary};
  }
`;

const RecentFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const RecentDuration = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.65rem;
  color: ${({ theme }) => theme.textMuted};
`;

const RecentTagRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const RecentTag = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  background: ${({ theme }) => theme.primaryLight};
  border-radius: 99px;
  padding: 1px 6px;
`;

const RecentTime = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.63rem;
  color: ${({ theme }) => theme.textMuted};
  opacity: 0.6;
`;

const RecentSpacer = styled.div`flex: 1;`;

const EmptyNote = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  padding: 4px 0;
`;

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mode, toggle } = useTheme();
  const [idea, setIdea] = useState('');
  const [saving, setSaving] = useState(false);

  const { items: jokes, loading: jokesLoading } = useResource('jokes');
  const { items: sets, loading: setsLoading } = useResource('sets');
  useEffect(() => { document.title = 'My Tight Five'; }, []);

  if (jokesLoading || setsLoading) return <DashboardSkeleton />;

  const recentJokes = jokes.slice(0, 8);
  const polishedJokes = jokes.filter(j => j.stage === 'polished');
  const polishedMinutes = Math.round(
    polishedJokes.reduce((acc, j) => acc + (j.duration_seconds || 0), 0) / 60
  );

  async function handleQuickIdea(e) {
    e.preventDefault();
    if (!idea.trim()) return;
    setSaving(true);
    try {
      await post('/ideas', { id: ulid(), created_at: new Date().toISOString(), text: idea.trim(), tags: [] });
      setIdea('');
      toast.success('Captured');
    } catch {
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <Header>
        <AppTitle>My Tight Five</AppTitle>
        <HeaderActions>
          <Button $variant="ghost" $size="sm" onClick={toggle}>{mode === 'dark' ? 'Light' : 'Dark'}</Button>
          <Button $variant="ghost" $size="sm" onClick={logout}>Sign out</Button>
        </HeaderActions>
      </Header>

      <StatRow>
        <StatCard>
          <StatValue>{polishedJokes.length}</StatValue>
          <StatLabel>Polished</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{`${polishedMinutes}m`}</StatValue>
          <StatLabel>Material</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{sets.length}</StatValue>
          <StatLabel>Sets</StatLabel>
        </StatCard>
      </StatRow>

      <QuickCapture onSubmit={handleQuickIdea}>
        <QuickInput
          placeholder="Quick idea..."
          value={idea}
          onChange={e => setIdea(e.target.value)}
        />
        <Button type="submit" disabled={saving || !idea.trim()}><Plus size={16} strokeWidth={2} /></Button>
      </QuickCapture>

      {recentJokes.length !== 0 && (
        <Section>
          <SectionHeader>
            <SectionTitle>Recent Jokes</SectionTitle>
            <Button $variant="link" $size="sm" onClick={() => navigate('/jokes')}>All</Button>
          </SectionHeader>

          <RecentList>
            {recentJokes.map((joke, i) => {
              const stageKey = joke.stage || 'draft';
              const color = STAGE_COLOR[stageKey]?.color;
              const tags = joke.tags?.slice(0, 4) ?? [];
              const callbackJoke = joke.callback_to ? jokes.find(j => j.id === joke.callback_to) : null;
              return (
                <RecentCard key={joke.id} to={`/jokes/${joke.id}`} $color={color} $i={i}>
                  <RecentSetup>{joke.setup || 'Untitled'}</RecentSetup>
                  {joke.punchline && <RecentPunchline>{joke.punchline}</RecentPunchline>}
                  {joke.notes && <RecentNotes>{joke.notes}</RecentNotes>}
                  {joke.callback_to && (
                    <RecentCallback
                      title={callbackJoke?.setup || 'Callback joke'}
                      onClick={e => { e.stopPropagation(); e.preventDefault(); navigate(`/jokes/${joke.callback_to}`); }}
                    >
                      <CornerDownLeft size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
                      {callbackJoke?.setup ?? '—'}
                    </RecentCallback>
                  )}
                  <RecentFooter>
                    <StageBadge stage={stageKey} />
                    {joke.duration_seconds > 0 && <RecentDuration>{formatDuration(joke.duration_seconds)}</RecentDuration>}
                    <RecentTime>{relativeTime(joke.created_at)}</RecentTime>
                    {tags.length > 0 && (
                      <RecentTagRow>
                        {tags.map(t => <RecentTag key={t}>#{t}</RecentTag>)}
                      </RecentTagRow>
                    )}
                    {joke.audio_url && <RecentSpacer />}
                    {joke.audio_url && <InlinePlayer url={joke.audio_url} />}
                  </RecentFooter>
                </RecentCard>
              );
            })}
          </RecentList>
        </Section>
      )}
    </Page>
  );
}
