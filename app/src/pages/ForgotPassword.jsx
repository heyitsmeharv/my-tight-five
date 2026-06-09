import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Input, Label, FormGroup } from '../components/ui/Input';

const Page = styled.div`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${({ theme }) => theme.bg};
`;

const Box = styled.div`
  width: 100%;
  max-width: 360px;
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 32px 24px;
  box-shadow: ${({ theme }) => theme.shadowMd};
`;

const AppName = styled.h1`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.primary};
  text-align: center;
  margin-bottom: 4px;
`;

const Tagline = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  text-align: center;
  margin-bottom: 28px;
`;

const Error = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.danger};
  margin-top: -8px;
  margin-bottom: 12px;
`;

const FooterLinks = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.83rem;
  color: ${({ theme }) => theme.textMuted};

  a, button {
    color: inherit;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
    text-align: left;

    &:hover { color: ${({ theme }) => theme.text}; }
  }
`;

export default function ForgotPassword() {
  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('request');
  const [form, setForm] = useState({ email: '', code: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleRequest(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(form.email.trim());
      setMode('reset');
    } catch (err) {
      setError(err.message || 'Could not send reset code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await confirmForgotPassword(form.email.trim(), form.code.trim(), form.password);
      navigate('/login', { state: { email: form.email.trim() } });
    } catch (err) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Box>
        <AppName>My Tight Five</AppName>
        <Tagline>
          {mode === 'request' ? 'Reset your password.' : 'Check your email for a reset code.'}
        </Tagline>

        {mode === 'request' ? (
          <form onSubmit={handleRequest}>
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoFocus
                required
              />
            </FormGroup>
            {error && <Error>{error}</Error>}
            <Button type="submit" disabled={loading || !form.email.trim()} style={{ width: '100%' }}>
              {loading ? 'Sending…' : 'Send reset code'}
            </Button>
            <FooterLinks>
              <button type="button" onClick={() => setMode('reset')}>Already have a code?</button>
              <Link to="/login">Back to sign in</Link>
            </FooterLinks>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="code">Reset code</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={form.code}
                onChange={set('code')}
                autoFocus
                autoComplete="one-time-code"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                required
              />
            </FormGroup>
            {error && <Error>{error}</Error>}
            <Button type="submit" disabled={loading || !form.code.trim() || !form.password} style={{ width: '100%' }}>
              {loading ? 'Resetting…' : 'Reset password'}
            </Button>
            <FooterLinks>
              <button type="button" onClick={() => { setMode('request'); setError(''); }}>Resend code</button>
              <Link to="/login">Back to sign in</Link>
            </FooterLinks>
          </form>
        )}
      </Box>
    </Page>
  );
}
