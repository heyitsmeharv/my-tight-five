import { useEffect } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1.5rem;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  opacity: 0.8;
  transition: opacity 0.15s;

  &:hover { opacity: 1; }
`;

const Player = styled.video`
  max-width: 100%;
  max-height: 100%;
  border-radius: ${({ theme }) => theme.radius};
  outline: none;
`;

export default function VideoModal({ url, onClose }) {
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <Overlay onClick={onClose}>
      <CloseBtn onClick={onClose} aria-label="Close video"><X size={22} strokeWidth={2} /></CloseBtn>
      <Player src={url} controls autoPlay onClick={e => e.stopPropagation()} />
    </Overlay>
  );
}
