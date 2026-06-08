export function parseDurationInput(str) {
  if (!str || !str.trim()) return null;
  const s = str.trim();
  const colon = s.match(/^(\d+):(\d{1,2})$/);
  if (colon) return parseInt(colon[1]) * 60 + parseInt(colon[2]);
  const minSecs = s.match(/^(\d+)\s*m\s*(\d+)\s*s?$/i);
  if (minSecs) return parseInt(minSecs[1]) * 60 + parseInt(minSecs[2]);
  const mins = s.match(/^(\d+)\s*m$/i);
  if (mins) return parseInt(mins[1]) * 60;
  const num = parseInt(s);
  return isNaN(num) ? null : num;
}

export function formatDuration(seconds) {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatTimer(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function totalSetDuration(jokes, jokeMap) {
  return jokes.reduce((acc, id) => acc + (jokeMap[id]?.duration_seconds || 0), 0);
}

export function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor(diff / 60_000);
  if (days > 13) return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
}
