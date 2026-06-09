import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
  text-align: center;
  color: ${({ theme }) => theme.textMuted};
`;

const Message = styled.p`
  font-size: 0.95rem;
`;

export const EmptyAction = styled.button`
  color: ${({ theme }) => theme.accent};
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  &:hover { opacity: 0.75; }
`;

export default function EmptyState({ message, children }) {
  return (
    <Wrapper>
      <Message>{message}</Message>
      {children}
    </Wrapper>
  );
}
