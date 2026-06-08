import styled from 'styled-components';

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: ${({ theme }) => theme.primaryLight};
  color: ${({ theme }) => theme.primary};
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
`;

export default Tag;
