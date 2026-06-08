import styled from 'styled-components';
import { STAGE_COLOR } from '../../utils/stages';

const Badge = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ $stage }) => STAGE_COLOR[$stage]?.color ?? STAGE_COLOR.draft.color};
`;

export default function StageBadge({ stage }) {
  return <Badge $stage={stage}>{stage}</Badge>;
}
