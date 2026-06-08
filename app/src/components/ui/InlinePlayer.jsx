import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Play, Pause, AlertCircle } from 'lucide-react';

const PlayBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.62rem;
  font-weight: 700;
  color: ${({ $playing, theme }) => $playing ? theme.primary : theme.accent};
  border: 1px solid ${({ $playing, theme }) => $playing ? theme.primary : theme.accent};
  background: ${({ $playing, theme }) => $playing ? 'transparent' : theme.accentLight};
  padding: 0.4rem 0.75rem;
  border-radius: 0.25rem;
  opacity: ${({ $playing }) => $playing ? 1 : 0.85};
  transition: all 0.15s;

  &:hover { opacity: 1; }
`;

const ErrBtn = styled(PlayBtn)`
  color: ${({ theme }) => theme.danger};
  border-color: ${({ theme }) => theme.danger};
  background: transparent;
  opacity: 0.8;
`;

export default function InlinePlayer({ url }) {
  const [playing, setPlaying] = useState(false);
  const [errored, setErrored] = useState(false);
  const audio = useRef(null);

  useEffect(() => () => audio.current?.pause(), []);

  useEffect(() => {
    if (audio.current) {
      audio.current.pause();
      audio.current.src = '';
    }
    audio.current = null;
    setPlaying(false);
    setErrored(false);
  }, [url]);

  function toggle(e) {
    e.stopPropagation();
    e.preventDefault();
    setErrored(false);

    if (!audio.current) {
      const a = new Audio(url);
      a.onended = () => setPlaying(false);
      a.onerror = () => {
        audio.current = null;
        setErrored(true);
        setPlaying(false);
      };
      audio.current = a;
    }

    if (playing) {
      audio.current.pause();
      setPlaying(false);
    } else {
      audio.current.play().catch(() => {
        audio.current = null;
        setErrored(true);
        setPlaying(false);
      });
      setPlaying(true);
    }
  }

  if (errored) {
    return (
      <ErrBtn onClick={toggle} $playing={false} title="Playback failed — tap to retry">
        <AlertCircle size={13} strokeWidth={2.5} />
      </ErrBtn>
    );
  }

  return (
    <PlayBtn onClick={toggle} $playing={playing} title={playing ? 'Pause recording' : 'Play recording'}>
      {playing ? <Pause size={13} strokeWidth={2.5} /> : <Play size={13} strokeWidth={2.5} />}
      {!playing && 'PLAY'}
    </PlayBtn>
  );
}
