import styled from 'styled-components';

const inputBase = `
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid;
  border-radius: 0;
  padding: 0.5rem 0;
  line-height: 1.6;
  transition: border-color 0.15s;

  &:focus { outline: none; }
  &::placeholder { opacity: 0.4; }
`;

export const Input = styled.input`
  ${inputBase}
  border-color: ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text};
  font-size: 0.95rem;
  min-height: 2.5rem;

  &:focus { border-color: ${({ theme }) => theme.primary}; }
  &::placeholder { color: ${({ theme }) => theme.textMuted}; opacity: 1; }
`;

export const Textarea = styled.textarea`
  ${inputBase}
  border-color: ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  resize: none;
  min-height: 4.5rem;
  overflow: hidden;

  &:focus { border-color: ${({ theme }) => theme.primary}; }
  &::placeholder { color: ${({ theme }) => theme.textMuted}; opacity: 1; }
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.5rem 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text};
  font-size: 0.95rem;
  min-height: 2.5rem;
  cursor: pointer;
  appearance: none;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
  }

  option { background: ${({ theme }) => theme.bgCard}; }
`;

export const Label = styled.label`
  display: block;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.125rem;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-bottom: 1.25rem;
`;
