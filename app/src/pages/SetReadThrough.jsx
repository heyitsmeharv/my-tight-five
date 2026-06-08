import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { SetReadThroughSkeleton } from '../components/ui/Skeleton';

const Page = styled.div`
  min-height: 100dvh;
  background: ${({ theme }) => theme.bg};
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SetName = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.textMuted};
  padding: 4px;
  transition: color 0.15s;
  &:hover { color: ${({ theme }) => theme.text}; }
`;

const Progress = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px 24px;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
`;

const JokeNumber = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 20px;
`;

const Setup = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 24px;
`;

const PunchlineToggle = styled.button`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: underline;
  padding: 0;
  cursor: pointer;
  margin-bottom: 16px;
  text-align: left;
`;

const Punchline = styled.p`
  font-size: 1.15rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.text};
  border-left: 3px solid ${({ theme }) => theme.primary};
  padding-left: 16px;
  margin-bottom: 24px;
`;

const Notes = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 32px;
  font-style: italic;
`;

const Nav = styled.div`
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 24px;
`;

const NavBtn = styled.button`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-size: 0.9rem;
  font-weight: 600;
  min-height: 48px;
  cursor: pointer;
  border: 1px solid ${({ $primary, theme }) => $primary ? theme.primary : theme.border};
  background: ${({ $primary, theme }) => $primary ? theme.primary : 'transparent'};
  color: ${({ $primary, theme }) => $primary ? theme.textInverse : theme.text};
  transition: opacity 0.15s;
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const CallbackNote = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.warning};
  margin-bottom: 16px;
`;

export default function SetReadThrough() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items: sets, loading: setsLoading } = useResource('sets');
  const { items: jokes, loading: jokesLoading } = useResource('jokes');
  const [index, setIndex] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);

  const set = sets.find(s => s.id === id);
  const jokeMap = Object.fromEntries(jokes.map(j => [j.id, j]));
  const setJokes = set ? (set.joke_ids || []).map(jid => jokeMap[jid]).filter(Boolean) : [];

  useEffect(() => { setShowPunchline(false); }, [index]);

  useEffect(() => {
    if (set) document.title = `${set.name} | My Tight Five`;
  }, [set?.name]);

  useEffect(() => {
    function handleKey(e) {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setIndex(i => (i < setJokes.length - 1 ? i + 1 : i));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setIndex(i => (i > 0 ? i - 1 : i));
      }

      if (e.key === ' ') { e.preventDefault(); setShowPunchline(true); }
      if (e.key === 'Escape') navigate(`/sets/${id}`);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setJokes.length, id, navigate]);

  if (setsLoading || jokesLoading) return <SetReadThroughSkeleton />;

  if (!set) {
    return (
      <Page style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: 0.4, fontSize: '0.9rem' }}>Set not found.</div>
      </Page>
    );
  }

  if (setJokes.length === 0) {
    return (
      <Page>
        <TopBar>
          <SetName>{set.name}</SetName>
          <CloseBtn onClick={() => navigate(`/sets/${id}`)}><X size={18} strokeWidth={2} /></CloseBtn>
        </TopBar>
        <Content>
          <Setup style={{ color: 'inherit', opacity: 0.4 }}>No jokes in this set.</Setup>
        </Content>
      </Page>
    );
  }

  const joke = setJokes[index];
  const callbackJoke = joke.callback_to ? jokeMap[joke.callback_to] : null;
  const isLast = index === setJokes.length - 1;

  return (
    <Page>
      <TopBar>
        <SetName>{set.name}</SetName>
        <Progress>{index + 1} / {setJokes.length}</Progress>
        <CloseBtn onClick={() => navigate(`/sets/${id}`)}><X size={18} strokeWidth={2} /></CloseBtn>
      </TopBar>

      <Content>
        <JokeNumber>Joke {index + 1}</JokeNumber>

        {callbackJoke && (
          <CallbackNote>Callback to: "{callbackJoke.setup?.slice(0, 60)}"</CallbackNote>
        )}

        <Setup>{joke.setup}</Setup>

        {joke.punchline && (
          <>
            {!showPunchline && (
              <PunchlineToggle onClick={() => setShowPunchline(true)}>Show punchline</PunchlineToggle>
            )}
            {showPunchline && <Punchline>{joke.punchline}</Punchline>}
          </>
        )}

        {joke.notes && <Notes>{joke.notes}</Notes>}

        <Nav>
          <NavBtn onClick={() => setIndex(i => i - 1)} disabled={index === 0}>
            <ChevronLeft size={18} strokeWidth={2} />
            Prev
          </NavBtn>
          {isLast
            ? <NavBtn $primary onClick={() => navigate(`/sets/${id}`)}>
                Done
                <Check size={16} strokeWidth={2.5} />
              </NavBtn>
            : <NavBtn $primary onClick={() => setIndex(i => i + 1)}>
                Next
                <ChevronRight size={18} strokeWidth={2} />
              </NavBtn>
          }
        </Nav>
      </Content>
    </Page>
  );
}
