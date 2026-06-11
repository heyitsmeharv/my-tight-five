import { getIdToken } from './cognito';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = import.meta.env.DEV && API_URL ? '/api' : API_URL;

let _onUnauthorized = null;
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn; }

async function request(method, path, body, signal) {
  let token = '';
  try {
    token = await getIdToken();
  } catch {
    // getIdToken throws if not authenticated; request will fail with 401
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 401) {
    _onUnauthorized?.();
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export const get  = (path, signal) => request('GET',    path, undefined, signal);
export const post = (path, body)   => request('POST',   path, body);
export const put  = (path, body)   => request('PUT',    path, body);
export const del  = (path)         => request('DELETE', path);

export function deleteAudioFile(jokeId) {
  return del(`/audio?jokeId=${encodeURIComponent(jokeId)}`);
}

export async function getAudioUploadUrl(jokeId, mimeType) {
  let token = '';
  try {
    token = await getIdToken();
  } catch {
    // expired session - fetch will fail with 401
  }
  const res = await fetch(
    `${BASE}/audio-upload-url?jokeId=${encodeURIComponent(jokeId)}&mimeType=${encodeURIComponent(mimeType)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to get upload URL: ${res.status}`);
  return res.json();
}
