const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
export const IS_DEV_MOCK = import.meta.env.DEV && !import.meta.env.VITE_COGNITO_USER_POOL_ID;

const REGION = USER_POOL_ID?.split('_')[0] ?? '';
const ENDPOINT = REGION ? `https://cognito-idp.${REGION}.amazonaws.com/` : '';
const STORAGE_KEY = 'mtf_session';

// --- Session storage ---
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? JSON.parse(raw) : null;
    return s?.idToken ? s : null;
  } catch { return null; }
}

function saveSession(s) {
  if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else localStorage.removeItem(STORAGE_KEY);
}

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// --- JWT helpers ---
function jwtExpiry(token) {
  try {
    const payload = token.split('.')[1];
    const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return exp ? exp * 1000 : null;
  } catch { return null; }
}

// --- Cognito HTTP ---
const ERROR_MAP = {
  NotAuthorizedException: 'Incorrect email or password.',
  UserNotConfirmedException: 'Account not confirmed - check your email for a verification code.',
  UsernameExistsException: 'An account with that email already exists.',
  CodeMismatchException: 'Incorrect verification code.',
  ExpiredCodeException: 'Verification code has expired - request a new one.',
  InvalidPasswordException: 'Password does not meet requirements (12+ chars, upper, lower, number, symbol).',
  InvalidParameterException: 'Password does not meet requirements (12+ chars, upper, lower, number, symbol).',
  UserNotFoundException: 'Incorrect email or password.',
  LimitExceededException: 'Too many attempts - please wait and try again.',
};

async function cognitoRequest(target, body) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = String(json.__type || json.code || '').split('#').pop();
    const err = new Error(ERROR_MAP[code] || json.message || 'Authentication failed.');
    err.code = code;
    throw err;
  }
  return json;
}

// --- Session helpers ---
function isValid(session) {
  if (!session?.idToken || !session?.expiresAt) return false;
  return session.expiresAt - 60_000 > Date.now();
}

function buildSession(auth, prevRefreshToken = null) {
  const idToken = auth?.IdToken ?? null;
  const accessToken = auth?.AccessToken ?? null;
  const refreshToken = auth?.RefreshToken ?? prevRefreshToken;
  const expiresAt = idToken ? jwtExpiry(idToken) : null;
  return { idToken, accessToken, refreshToken, expiresAt };
}

async function refreshSession(session) {
  if (!session?.refreshToken) { clearStoredSession(); return null; }
  try {
    const data = await cognitoRequest('InitiateAuth', {
      ClientId: CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: { REFRESH_TOKEN: session.refreshToken },
    });
    const next = buildSession(data.AuthenticationResult, session.refreshToken);
    saveSession(next);
    return next;
  } catch {
    clearStoredSession();
    return null;
  }
}

async function getValidSession() {
  const session = loadSession();
  if (!session) return null;
  if (isValid(session)) return session;
  return refreshSession(session);
}

// --- Public API ---

export function getCurrentUser() {
  if (IS_DEV_MOCK) return { mock: true };
  return loadSession() ? { present: true } : null;
}

export async function getSession() {
  if (IS_DEV_MOCK) return { mock: true };
  const session = await getValidSession();
  if (!session) throw new Error('No current user');
  return session;
}

export async function getIdToken() {
  if (IS_DEV_MOCK) return 'dev-mock-token';
  const session = await getValidSession();
  if (!session?.idToken) throw new Error('Not authenticated');
  return session.idToken;
}

export async function signIn(email, password) {
  if (IS_DEV_MOCK) return null;
  const data = await cognitoRequest('InitiateAuth', {
    ClientId: CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email.trim().toLowerCase(),
      PASSWORD: password,
    },
  });
  if (data.ChallengeName) {
    const err = new Error('Unsupported sign-in challenge - contact support.');
    err.code = data.ChallengeName;
    throw err;
  }
  const session = buildSession(data.AuthenticationResult);
  saveSession(session);
  return session;
}

export function signOut() {
  if (IS_DEV_MOCK) return;
  clearStoredSession();
}

export async function signUp(email, password, name) {
  if (IS_DEV_MOCK) return { userConfirmed: true };
  const data = await cognitoRequest('SignUp', {
    ClientId: CLIENT_ID,
    Username: email.trim().toLowerCase(),
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email.trim().toLowerCase() },
      { Name: 'name', Value: name.trim() },
    ],
  });
  return { userConfirmed: data.UserConfirmed, userSub: data.UserSub };
}

export async function confirmSignUp(email, code) {
  if (IS_DEV_MOCK) return;
  await cognitoRequest('ConfirmSignUp', {
    ClientId: CLIENT_ID,
    Username: email.trim().toLowerCase(),
    ConfirmationCode: String(code).trim(),
  });
}

export async function resendConfirmationCode(email) {
  if (IS_DEV_MOCK) return;
  await cognitoRequest('ResendConfirmationCode', {
    ClientId: CLIENT_ID,
    Username: email.trim().toLowerCase(),
  });
}

export async function forgotPassword(email) {
  if (IS_DEV_MOCK) return;
  await cognitoRequest('ForgotPassword', {
    ClientId: CLIENT_ID,
    Username: email.trim().toLowerCase(),
  });
}

export async function confirmForgotPassword(email, code, newPassword) {
  if (IS_DEV_MOCK) return;
  await cognitoRequest('ConfirmForgotPassword', {
    ClientId: CLIENT_ID,
    Username: email.trim().toLowerCase(),
    ConfirmationCode: String(code).trim(),
    Password: newPassword,
  });
}
