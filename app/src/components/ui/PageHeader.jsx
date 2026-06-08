import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.bg};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  color: ${({ theme }) => theme.textMuted};
  flex-shrink: 0;
  transition: color 0.15s;

  &:hover { color: ${({ theme }) => theme.text}; }
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  flex: 1;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export default function PageHeader({ title, back, onBack, actions }) {
  const navigate = useNavigate();
  return (
    <Wrapper>
      {back !== false && (
        <BackBtn onClick={() => onBack ? onBack() : navigate(back || -1)} aria-label="Go back"><ArrowLeft size={18} strokeWidth={2} /></BackBtn>
      )}
      <Title>{title}</Title>
      {actions && <Actions>{actions}</Actions>}
    </Wrapper>
  );
}
