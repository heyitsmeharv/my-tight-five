import styled from 'styled-components';

const Card = styled.div`
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  box-shadow: ${({ theme }) => theme.shadow};
  padding: ${({ $compact }) => $compact ? '0.75rem' : '1rem'};
`;

export default Card;
