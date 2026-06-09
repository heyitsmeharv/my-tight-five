import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    /* Scales from 15px on small mobile to 17px on large desktop */
    font-size: clamp(15px, 0.5vw + 13px, 17px);
    -webkit-text-size-adjust: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.fontSans};
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    line-height: 1.55;
    min-height: 100dvh;
    transition: background 0.2s, color 0.2s;
  }

  #root {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
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
    min-width: 260px;
    max-width: 360px;
    padding: 0;
    top: 16px !important;
    right: 16px !important;

    @media (min-width: 768px) {
      top: 24px !important;
      right: 24px !important;
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
    padding: 12px 16px;
    min-height: 48px;
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
