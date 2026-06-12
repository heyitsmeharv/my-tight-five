import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  IS_DEV_MOCK,
  getCurrentUser,
  getSession,
  signOut as cognitoSignOut,
  signUp as cognitoSignUp,
  confirmSignUp as cognitoConfirmSignUp,
  resendConfirmationCode as cognitoResendCode,
  forgotPassword as cognitoForgotPassword,
  confirmForgotPassword as cognitoConfirmForgotPassword,
} from '../utils/cognito';
import { setUnauthorizedHandler } from '../utils/api';

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
  const forgotPassword = useCallback((email) => cognitoForgotPassword(email), []);
  const confirmForgotPassword = useCallback((email, code, newPassword) => cognitoConfirmForgotPassword(email, code, newPassword), []);

  const value = useMemo(
    () => ({ isAuthenticated, login, logout, signup, confirmSignUp, resendCode, forgotPassword, confirmForgotPassword }),
    [isAuthenticated, login, logout, signup, confirmSignUp, resendCode, forgotPassword, confirmForgotPassword]
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
