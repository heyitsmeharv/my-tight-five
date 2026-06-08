import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCurrentUser,
  getSession,
  signOut as cognitoSignOut,
  signUp as cognitoSignUp,
  confirmSignUp as cognitoConfirmSignUp,
  resendConfirmationCode as cognitoResendCode,
} from '../utils/cognito';
import { setUnauthorizedHandler } from '../utils/api';

const IS_DEV_MOCK = import.meta.env.DEV && !import.meta.env.VITE_COGNITO_USER_POOL_ID;

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(!IS_DEV_MOCK);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      cognitoSignOut();
      setIsAuthenticated(false);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (IS_DEV_MOCK) {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    getSession()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(() => setIsAuthenticated(true), []);

  const logout = useCallback(() => {
    cognitoSignOut();
    setIsAuthenticated(false);
  }, []);

  const signup = useCallback((email, password, name) => cognitoSignUp(email, password, name), []);
  const confirmSignUp = useCallback((email, code) => cognitoConfirmSignUp(email, code), []);
  const resendCode = useCallback((email) => cognitoResendCode(email), []);

  const value = useMemo(
    () => ({ isAuthenticated, login, logout, signup, confirmSignUp, resendCode }),
    [isAuthenticated, login, logout, signup, confirmSignUp, resendCode]
  );

  if (loading) return null;

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
