import styled, { css, keyframes } from 'styled-components';

const spin = keyframes`to { transform: rotate(360deg); }`;

const variants = {
  primary: css`
    background: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.bg};
    font-weight: 700;
    &:hover:not(:disabled) { opacity: 0.88; }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.textMuted};
    border: 1px solid ${({ theme }) => theme.border};
    &:hover:not(:disabled) {
      color: ${({ theme }) => theme.text};
      border-color: ${({ theme }) => theme.textMuted};
    }
  `,
  danger: css`
    background: transparent;
    color: ${({ theme }) => theme.danger};
    border: 1px solid ${({ theme }) => theme.danger};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.dangerLight}; }
  `,
  link: css`
    background: transparent;
    color: ${({ theme }) => theme.primary};
    padding: 0;
    font-weight: 400;
    &:hover:not(:disabled) { opacity: 0.75; }
  `,
};

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${({ $size }) => $size === 'sm' ? '6px 14px' : '10px 20px'};
  font-family: ${({ theme }) => theme.fontMono};
  font-size: ${({ $size }) => $size === 'sm' ? '0.78rem' : '0.85rem'};
  letter-spacing: 0.05em;
  border-radius: ${({ theme }) => theme.radiusSm};
  transition: background 0.15s, opacity 0.15s, color 0.15s, border-color 0.15s;
  min-height: ${({ $size }) => $size === 'sm' ? '36px' : '44px'};
  white-space: nowrap;
  text-transform: uppercase;
  ${({ $variant }) => variants[$variant || 'primary']}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  ${({ $loading }) => $loading && css`
    cursor: wait;
    pointer-events: none;
    opacity: 0.75;
    &::before {
      content: '';
      width: 10px;
      height: 10px;
      border: 1.5px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: ${spin} 0.55s linear infinite;
      flex-shrink: 0;
    }
  `}
`;

export default Button;
