import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Play, Pause, Square, AlertCircle, Repeat } from 'lucide-react';

const Btn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3125rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.58rem;
  font-weight: 700;
  color: ${({ $active, theme }) => $active ? theme.primary : theme.accent};
  border: 1px solid ${({ $active, theme }) => $active ? theme.primary : theme.accent};
  background: ${({ $active, theme }) => $active ? 'transparent' : theme.accentLight};
  padding: 0.25rem 0.5rem;
  min-height: 2.25rem;

  @media (min-width: 480px) {
    min-height: 1.75rem;
    font-size: 0.62rem;
    padding: 0.4rem 0.75rem;
  }
  border-radius: 0.25rem;
  opacity: ${({ $active }) => $active ? 1 : 0.85};
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover { opacity: 1; }
`;

const StopBtn = styled(Btn)`
  color: ${({ theme }) => theme.textMuted};
  border-color: ${({ theme }) => theme.border};
  background: transparent;
`;

const ErrBtn = styled(Btn)`
  color: ${({ theme }) => theme.danger};
  border-color: ${({ theme }) => theme.danger};
  background: transparent;
  opacity: 0.8;
`;

const LoopBtn = styled(Btn)`
  color: ${({ $active, theme }) => $active ? theme.primary : theme.textMuted};
  border-color: ${({ $active, theme }) => $active ? theme.primary : theme.border};
  background: transparent;
`;

const Group = styled.span`
  display: inline-flex;
  gap: 0.25rem;
`;

export default function InlinePlayer({ url, showLoop }) {
  const [state, setState] = useState('idle'); // idle | playing | paused
  const [errored, setErrored] = useState(false);
  const [looping, setLooping] = useState(false);
  const audio = useRef(null);

  useEffect(() => () => audio.current?.pause(), []);

  useEffect(() => {
    if (audio.current) {
      audio.current.pause();
      audio.current.src = '';
    }
    audio.current = null;
    setState('idle');
    setErrored(false);
  }, [url]);

  function getAudio() {
    if (audio.current) return audio.current;
    const a = new Audio(url);
    a.loop = looping;
    a.onended = () => setState('idle');
    a.onerror = () => {
      audio.current = null;
      setErrored(true);
      setState('idle');
    };
    audio.current = a;
    return a;
  }

  function toggleLoop(e) {
    e.stopPropagation();
    e.preventDefault();
    const next = !looping;
    setLooping(next);
    if (audio.current) audio.current.loop = next;
  }

  function play(e) {
    e.stopPropagation();
    e.preventDefault();
    setErrored(false);
    const a = getAudio();
    a.play().catch((err) => {
      if (err.name === 'AbortError') return;
      audio.current = null;
      setErrored(true);
      setState('idle');
    });
    setState('playing');
  }

  function pause(e) {
    e.stopPropagation();
    e.preventDefault();
    audio.current?.pause();
    setState('paused');
  }

  function stop(e) {
    e.stopPropagation();
    e.preventDefault();
    if (audio.current) {
      audio.current.onended = null;
      audio.current.onerror = null;
      audio.current.pause();
      audio.current.src = '';
      audio.current = null;
    }
    setState('idle');
  }

  if (errored) {
    return (
      <ErrBtn onClick={play} $active={false} title="Playback failed - tap to retry">
        <AlertCircle size={13} strokeWidth={2.5} />
      </ErrBtn>
    );
  }

  if (state === 'idle') {
    return (
      <Group>
        <Btn onClick={play} $active={false} title="Play recording">
          <Play size={13} strokeWidth={2.5} />
          PLAY
        </Btn>
        {showLoop && (
          <LoopBtn onClick={toggleLoop} $active={looping} title={looping ? 'Loop on' : 'Loop off'}>
            <Repeat size={11} strokeWidth={2.5} />
            LOOP
          </LoopBtn>
        )}
      </Group>
    );
  }

  return (
    <Group>
      {state === 'playing' ? (
        <Btn onClick={pause} $active title="Pause">
          <Pause size={13} strokeWidth={2.5} />
          PAUSE
        </Btn>
      ) : (
        <Btn onClick={play} $active={false} title="Resume">
          <Play size={13} strokeWidth={2.5} />
          RESUME
        </Btn>
      )}
      <StopBtn onClick={stop} $active={false} title="Stop">
        <Square size={11} fill="currentColor" strokeWidth={0} />
        STOP
      </StopBtn>
      {showLoop && (
        <LoopBtn onClick={toggleLoop} $active={looping} title={looping ? 'Loop on' : 'Loop off'}>
          <Repeat size={11} strokeWidth={2.5} />
          LOOP
        </LoopBtn>
      )}
    </Group>
  );
}
