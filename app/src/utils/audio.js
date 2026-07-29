export function audioKeyFromUrl(url) {
  if (!url) return null;
  if (url.startsWith('audio/')) return url;
  try { return new URL(url).pathname.slice(1); } catch { return null; }
}

export function audioIdFromUrl(url) {
  const key = audioKeyFromUrl(url);
  if (!key) return null;
  const match = key.match(/\/([^/]+)\.[^./]+$/);
  return match ? match[1] : null;
}
