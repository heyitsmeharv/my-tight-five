import React from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 1.5rem;
  text-align: center;
  background: ${({ theme }) => theme.bg};
`;

const Heading = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const Detail = styled.p`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.textMuted};
  max-width: 18.75rem;
  line-height: 1.5;
  margin: 0;
  opacity: 0.7;
`;

const HomeBtn = styled.button`
  padding: 0.5rem 1.25rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.textInverse};
  border-radius: ${({ theme }) => theme.radiusSm};
  border: 1px solid ${({ theme }) => theme.accent};
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: ${({ theme }) => theme.accentHover}; }
`;

function ErrorFallback({ error, onReset }) {
  return (
    <Wrap>
      <Heading>Something went wrong.</Heading>
      {import.meta.env.DEV && error?.message && <Detail>{error.message}</Detail>}
      <HomeBtn onClick={onReset}>Go home</HomeBtn>
    </Wrap>
  );
}

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => { this.setState({ error: null }); window.location.href = '/'; }}
        />
      );
    }
    return this.props.children;
  }
}
