import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { signIn } from '../utils/cognito';
import Button from '../components/ui/Button';
import { Input, Label, FormGroup } from '../components/ui/Input';

const Page = styled.div`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: ${({ theme }) => theme.bg};
`;

const Box = styled.div`
  width: 100%;
  max-width: 22.5rem;
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 1.75rem 1.25rem;
  box-shadow: ${({ theme }) => theme.shadowMd};

  @media (max-width: 400px) {
    padding: 1.5rem 1rem;
  }
`;

const AppName = styled.h1`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.primary};
  text-align: center;
  margin-bottom: 0.25rem;
`;

const Tagline = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  text-align: center;
  margin-bottom: 1.75rem;
`;

const Error = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.danger};
  margin-top: -0.5rem;
  margin-bottom: 0.75rem;
`;

const FooterLinks = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
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

export default function SignUp() {
  const { signup, confirmSignUp, resendCode, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialMode = location.state?.mode === 'confirm' ? 'confirm' : 'signup';
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    name: '',
    email: location.state?.email || '',
    password: '',
    confirmPassword: '',
    code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signup(form.email.trim(), form.password, form.name.trim());
      if (result.userConfirmed) {
        await signIn(form.email.trim(), form.password);
        login();
        navigate('/', { replace: true });
      } else {
        setMode('confirm');
      }
    } catch (err) {
      if (err.code === 'UsernameExistsException') {
        setMode('confirm');
        return;
      }
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await confirmSignUp(form.email.trim(), form.code.trim());
      if (form.password) {
        await signIn(form.email.trim(), form.password);
        login();
        navigate('/', { replace: true });
      } else {
        navigate('/login', { state: { email: form.email.trim() } });
      }
    } catch (err) {
      setError(err.message || 'Confirmation failed.');
    } finally {
      setLoading(false);
    }
  }

  const [resendLoading, setResendLoading] = useState(false);

  async function handleResend() {
    setError('');
    setResendLoading(true);
    try {
      await resendCode(form.email.trim());
    } catch (err) {
      setError(err.message || 'Could not resend code.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <Page>
      <Box>
        <AppName>My Tight Five</AppName>
        <Tagline>
          {mode === 'confirm' ? 'Check your email for a confirmation code.' : 'Create your account.'}
        </Tagline>

        {mode === 'signup' ? (
          <form onSubmit={handleSignUp}>
            <FormGroup>
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" placeholder="Your name" value={form.name} onChange={set('name')} autoFocus required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} required />
            </FormGroup>
            {error && <Error>{error}</Error>}
            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
            <FooterLinks>
              <button type="button" onClick={() => setMode('confirm')}>Already have a confirmation code?</button>
              <Link to="/login">Already have an account? Sign in</Link>
            </FooterLinks>
          </form>
        ) : (
          <form onSubmit={handleConfirm}>
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="code">Confirmation code</Label>
              <Input id="code" type="text" placeholder="123456" value={form.code} onChange={set('code')} autoFocus autoComplete="one-time-code" required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="password">Password <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional - auto-signs you in)</span></Label>
              <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
            </FormGroup>
            {error && <Error>{error}</Error>}
            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Confirming…' : 'Confirm account'}
            </Button>
            <FooterLinks>
              <button type="button" onClick={handleResend} disabled={resendLoading}>{resendLoading ? 'Sending…' : 'Resend code'}</button>
              <button type="button" onClick={() => setMode('signup')}>Back to sign up</button>
              <Link to="/login">Already confirmed? Sign in</Link>
            </FooterLinks>
          </form>
        )}
      </Box>
    </Page>
  );
}
