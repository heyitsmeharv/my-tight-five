import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Play, Pause, Square, AlertCircle } from 'lucide-react';

const Btn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3125rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.62rem;
  font-weight: 700;
  color: ${({ $active, theme }) => $active ? theme.primary : theme.accent};
  border: 1px solid ${({ $active, theme }) => $active ? theme.primary : theme.accent};
  background: ${({ $active, theme }) => $active ? 'transparent' : theme.accentLight};
  padding: 0.4rem 0.75rem;
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
  padding: 0.4rem 0.5rem;
`;

const ErrBtn = styled(Btn)`
  color: ${({ theme }) => theme.danger};
  border-color: ${({ theme }) => theme.danger};
  background: transparent;
  opacity: 0.8;
`;

const Group = styled.span`
  display: inline-flex;
  gap: 0.25rem;
`;

export default function InlinePlayer({ url }) {
  const [state, setState] = useState('idle'); // idle | playing | paused
  const [errored, setErrored] = useState(false);
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
    a.onended = () => setState('idle');
    a.onerror = () => {
      audio.current = null;
      setErrored(true);
      setState('idle');
    };
    audio.current = a;
    return a;
  }

  function play(e) {
    e.stopPropagation();
    e.preventDefault();
    setErrored(false);
    const a = getAudio();
    a.play().catch(() => {
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
      <Btn onClick={play} $active={false} title="Play recording">
        <Play size={13} strokeWidth={2.5} />
        PLAY
      </Btn>
    );
  }

  return (
    <Group>
      {state === 'playing' ? (
        <Btn onClick={pause} $active title="Pause">
          <Pause size={13} strokeWidth={2.5} />
        </Btn>
      ) : (
        <Btn onClick={play} $active={false} title="Resume">
          <Play size={13} strokeWidth={2.5} />
        </Btn>
      )}
      <StopBtn onClick={stop} $active={false} title="Stop">
        <Square size={11} fill="currentColor" strokeWidth={0} />
      </StopBtn>
    </Group>
  );
}
