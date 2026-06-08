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

const FooterLinks = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.83rem;
  color: ${({ theme }) => theme.textMuted};

  a {
    color: inherit;
    text-decoration: none;
    &:hover { color: ${({ theme }) => theme.text}; }
  }
`;

const Error = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.danger};
  margin-top: -8px;
  margin-bottom: 12px;
`;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      login();
      navigate('/', { replace: true });
    } catch (err) {
      if (err.code === 'UserNotConfirmedException') {
        navigate('/signup', { state: { mode: 'confirm', email: email.trim() } });
        return;
      }
      setError(err.message || 'Sign in failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Box>
        <AppName>My Tight Five</AppName>
        <Tagline>Your standup comedy workspace</Tagline>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </FormGroup>
          {error && <Error>{error}</Error>}
          <Button
            type="submit"
            disabled={loading || !email.trim() || !password}
            style={{ width: '100%' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <FooterLinks>
            <Link to="/signup">Don't have an account? Sign up</Link>
          </FooterLinks>
        </form>
      </Box>
    </Page>
  );
}
