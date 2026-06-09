import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    /* Scales from 14px on small mobile to 16px on large desktop */
    font-size: clamp(14px, 0.5vw + 12px, 16px);
    -webkit-text-size-adjust: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.fontSans};
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    line-height: 1.55;
    min-height: 100dvh;
    overflow-x: hidden;
    transition: background 0.2s, color 0.2s;
  }

  #root {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
  }

  /* Minimum touch targets on touch-primary devices */
  @media (pointer: coarse) {
    button, a {
      min-height: 2.75rem;
    }
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  img { max-width: 100%; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 2px;
  }

  /* ── Toast overrides ─────────────────────────────────────── */
  .Toastify__toast-container {
    width: auto;
    min-width: 16.25rem;
    max-width: 22.5rem;
    padding: 0;
    top: 1rem !important;
    right: 1rem !important;

    @media (min-width: 768px) {
      top: 1.5rem !important;
      right: 1.5rem !important;
    }
  }

  .Toastify__toast {
    background: ${({ theme }) => theme.bgCard};
    border: 1px solid ${({ theme }) => theme.border};
    border-left-width: 3px;
    border-radius: ${({ theme }) => theme.radiusSm};
    box-shadow: ${({ theme }) => theme.shadowMd};
    color: ${({ theme }) => theme.text};
    font-family: ${({ theme }) => theme.fontMono};
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem;
    min-height: 3rem;
  }

  .Toastify__toast--success {
    border-left-color: ${({ theme }) => theme.success};
  }

  .Toastify__toast--error {
    border-left-color: ${({ theme }) => theme.danger};
  }

  .Toastify__toast--warning {
    border-left-color: ${({ theme }) => theme.warning};
  }

  .Toastify__toast-body {
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
  }

  .Toastify__toast-icon {
    display: none;
  }
`;

export default GlobalStyle;
