import styled from 'styled-components';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const REACTION_COLORS = { '1': '#10b981', '0': '#9ca3af', '-1': '#ef4444' };

function calcTrend(reactions) {
  if (reactions.length < 4) return 'neutral';
  const sorted = [...reactions].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  const mid = Math.floor(sorted.length / 2);
  const avg = arr => arr.reduce((s, r) => s + r.rating, 0) / arr.length;
  const diff = avg(sorted.slice(mid)) - avg(sorted.slice(0, mid));
  if (diff > 0.2) return 'up';
  if (diff < -0.2) return 'down';
  return 'neutral';
}

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0.375rem;
`;

const Dot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const TrendIcon = styled.span`
  display: flex;
  align-items: center;
  margin-left: 2px;
  color: ${({ $trend }) => $trend === 'up' ? '#10b981' : '#ef4444'};
`;

export default function ReactionWidget({ reactions = [] }) {
  if (!reactions.length) return null;

  const sorted = [...reactions].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const last5 = sorted.slice(0, 5);
  const trend = calcTrend(reactions);

  return (
    <Wrap>
      {last5.map((r, i) => <Dot key={i} $color={REACTION_COLORS[String(r.rating)]} />)}
      {reactions.length >= 4 && trend !== 'neutral' && (
        <TrendIcon $trend={trend}>
          {trend === 'up' ? <TrendingUp size={10} strokeWidth={2} /> : <TrendingDown size={10} strokeWidth={2} />}
        </TrendIcon>
      )}
    </Wrap>
  );
}
