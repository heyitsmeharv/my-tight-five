import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
`;

const Shine = styled.div`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.bgCard} 25%,
    ${({ theme }) => theme.border} 50%,
    ${({ theme }) => theme.bgCard} 75%
  );
  background-size: 1200px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${({ theme }) => theme.radiusSm};
`;

export const SkeletonLine = styled(Shine)`
  height: ${({ $h }) => $h || 12}px;
  width: ${({ $w }) => (typeof $w === 'number' ? `${$w}px` : $w) || '100%'};
`;

/* Single-column joke card skeleton */
const SJokeCard = styled.div`
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-left: 4px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 14px 46px 14px 16px;
`;

/* Idea list row skeleton */
const SIdeaRow = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px 12px 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
  border-left: 2px solid ${({ theme }) => theme.border};
`;


const SCard = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  background: ${({ theme }) => theme.bgCard};
  padding: 14px 16px;
  margin-bottom: 10px;
`;

export function JokeCardSkeleton() {
  return (
    <SJokeCard>
      <SkeletonLine $h={15} style={{ marginBottom: 7 }} />
      <SkeletonLine $h={15} style={{ marginBottom: 10, maxWidth: '68%' }} />
      <SkeletonLine $h={12} style={{ marginBottom: 12, maxWidth: '88%' }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <SkeletonLine $h={20} $w={54} style={{ borderRadius: 99 }} />
        <SkeletonLine $h={11} $w={38} />
      </div>
    </SJokeCard>
  );
}

export function IdeaRowSkeleton() {
  return (
    <SIdeaRow>
      <div style={{ flex: 1 }}>
        <SkeletonLine $h={13} style={{ marginBottom: 6 }} />
        <SkeletonLine $h={13} style={{ marginBottom: 6, maxWidth: '80%' }} />
        <SkeletonLine $h={10} $w={48} />
      </div>
      <div style={{ display: 'flex', gap: 4, paddingTop: 2 }}>
        <SkeletonLine $h={24} $w={44} style={{ borderRadius: 3 }} />
        <SkeletonLine $h={24} $w={24} style={{ borderRadius: 3 }} />
      </div>
    </SIdeaRow>
  );
}


export function SetCardSkeleton() {
  return (
    <SCard>
      <SkeletonLine $h={15} style={{ marginBottom: 8, maxWidth: '55%' }} />
      <SkeletonLine $h={10} style={{ marginBottom: 12, maxWidth: '38%' }} />
      <SkeletonLine $h={3} style={{ borderRadius: 2 }} />
    </SCard>
  );
}

const SHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${({ theme }) => theme.bg};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  height: 50px;
`;

const SEditPage = styled.div`
  padding-bottom: 80px;
  max-width: 600px;
  margin: 0 auto;
`;

const SEditBody = styled.div`
  padding: 20px 16px;
`;

const SStageRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

export function JokeEditSkeleton() {
  return (
    <SEditPage>
      <SHeader>
        <SkeletonLine $h={14} $w={24} style={{ flexShrink: 0 }} />
        <SkeletonLine $h={16} style={{ maxWidth: '40%' }} />
      </SHeader>
      <SEditBody>
        <SkeletonLine $h={18} style={{ marginBottom: 10 }} />
        <SkeletonLine $h={18} style={{ marginBottom: 10, maxWidth: '75%' }} />
        <SkeletonLine $h={18} style={{ marginBottom: 24, maxWidth: '50%' }} />
        <SkeletonLine $h={1} style={{ marginBottom: 16 }} />
        <SkeletonLine $h={16} style={{ marginBottom: 10 }} />
        <SkeletonLine $h={16} style={{ marginBottom: 24, maxWidth: '60%' }} />
        <SStageRow>
          {[70, 55, 80, 60, 65].map((w, i) => (
            <SkeletonLine key={i} $h={26} $w={w} style={{ borderRadius: 99 }} />
          ))}
        </SStageRow>
      </SEditBody>
    </SEditPage>
  );
}

const SPage = styled.div`
  padding-bottom: 80px;
  max-width: 600px;
  margin: 0 auto;
`;

const STimingBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SBody = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SJokeRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-left: 4px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 14px 16px;
`;

function SJokeCardSkeleton() {
  return (
    <SJokeRow>
      <SkeletonLine $h={14} $w={8} style={{ marginTop: 3, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <SkeletonLine $h={14} style={{ marginBottom: 7 }} />
        <SkeletonLine $h={14} style={{ marginBottom: 10, maxWidth: '70%' }} />
        <SkeletonLine $h={11} style={{ maxWidth: '88%' }} />
      </div>
    </SJokeRow>
  );
}

export function SetDetailSkeleton() {
  return (
    <SPage>
      <SHeader>
        <SkeletonLine $h={14} $w={24} style={{ flexShrink: 0 }} />
        <SkeletonLine $h={16} style={{ maxWidth: '50%' }} />
      </SHeader>
      <STimingBar>
        <SkeletonLine $h={12} $w={60} />
        <SkeletonLine $h={6} style={{ flex: 1 }} />
        <SkeletonLine $h={12} $w={40} />
      </STimingBar>
      <SBody>
        {[0, 1, 2].map(i => <SJokeCardSkeleton key={i} />)}
      </SBody>
    </SPage>
  );
}

const SFiltersBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  overflow-x: auto;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SCaptureBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SIdeaList = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const SDashHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SStatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid ${({ theme }) => theme.border};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SStatCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  gap: 6px;
  &:not(:last-child) { border-right: 1px solid ${({ theme }) => theme.border}; }
`;

const SQuickCapture = styled.div`
  display: flex;
  gap: 10px;
  padding: 16px;
  margin-bottom: 8px;
`;

const SSectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export function JokesPageSkeleton() {
  return (
    <SPage>
      <SHeader>
        <SkeletonLine $h={14} $w={24} style={{ flexShrink: 0 }} />
        <SkeletonLine $h={16} style={{ maxWidth: '30%' }} />
        <SkeletonLine $h={30} $w={72} style={{ marginLeft: 'auto', borderRadius: 6, flexShrink: 0 }} />
      </SHeader>
      <SFiltersBar>
        {[38, 52, 58, 68].map((w, i) => (
          <SkeletonLine key={i} $h={28} $w={w} style={{ borderRadius: 99, flexShrink: 0 }} />
        ))}
      </SFiltersBar>
      <SBody>
        {[0, 1, 2, 3].map(i => <JokeCardSkeleton key={i} />)}
      </SBody>
    </SPage>
  );
}

export function SetsPageSkeleton() {
  return (
    <SPage>
      <SHeader>
        <SkeletonLine $h={14} $w={24} style={{ flexShrink: 0 }} />
        <SkeletonLine $h={16} style={{ maxWidth: '25%' }} />
        <SkeletonLine $h={30} $w={80} style={{ marginLeft: 'auto', borderRadius: 6, flexShrink: 0 }} />
      </SHeader>
      <div style={{ padding: 16 }}>
        {[0, 1, 2].map(i => <SetCardSkeleton key={i} />)}
      </div>
    </SPage>
  );
}

export function IdeasPageSkeleton() {
  return (
    <SPage>
      <SHeader>
        <SkeletonLine $h={14} $w={24} style={{ flexShrink: 0 }} />
        <SkeletonLine $h={16} style={{ maxWidth: '28%' }} />
      </SHeader>
      <SCaptureBar>
        <SkeletonLine $h={36} style={{ flex: 1 }} />
        <SkeletonLine $h={36} $w={36} style={{ flexShrink: 0, borderRadius: 6 }} />
      </SCaptureBar>
      <SIdeaList>
        {[0, 1, 2, 3].map(i => <IdeaRowSkeleton key={i} />)}
      </SIdeaList>
    </SPage>
  );
}

const SReadPage = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const STopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  height: 49px;
`;

const SReadContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px 24px;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
`;

const SReadNav = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 24px;
  margin-top: auto;
`;

export function SetReadThroughSkeleton() {
  return (
    <SReadPage>
      <STopBar>
        <SkeletonLine $h={14} $w={130} />
        <SkeletonLine $h={12} $w={36} />
        <SkeletonLine $h={24} $w={24} style={{ borderRadius: 4 }} />
      </STopBar>
      <SReadContent>
        <SkeletonLine $h={12} $w={52} style={{ marginBottom: 20, borderRadius: 99 }} />
        <SkeletonLine $h={28} style={{ marginBottom: 12 }} />
        <SkeletonLine $h={28} style={{ marginBottom: 24, maxWidth: '72%' }} />
        <SkeletonLine $h={14} $w={110} />
        <SReadNav>
          <SkeletonLine $h={48} style={{ flex: 1, borderRadius: 6 }} />
          <SkeletonLine $h={48} style={{ flex: 1, borderRadius: 6 }} />
        </SReadNav>
      </SReadContent>
    </SReadPage>
  );
}

export function DashboardSkeleton() {
  return (
    <SPage>
      <SDashHeader>
        <SkeletonLine $h={18} $w={110} />
        <div style={{ display: 'flex', gap: 8 }}>
          <SkeletonLine $h={30} $w={52} style={{ borderRadius: 6 }} />
          <SkeletonLine $h={30} $w={72} style={{ borderRadius: 6 }} />
        </div>
      </SDashHeader>
      <SStatRow>
        {[0, 1, 2].map(i => (
          <SStatCard key={i}>
            <SkeletonLine $h={22} $w={36} />
            <SkeletonLine $h={10} $w={52} />
          </SStatCard>
        ))}
      </SStatRow>
      <SQuickCapture>
        <SkeletonLine $h={38} style={{ flex: 1 }} />
        <SkeletonLine $h={38} $w={38} style={{ flexShrink: 0, borderRadius: 6 }} />
      </SQuickCapture>
      <div style={{ padding: '0 16px' }}>
        <SSectionHead>
          <SkeletonLine $h={14} $w={90} />
          <SkeletonLine $h={14} $w={28} />
        </SSectionHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1, 2].map(i => <JokeCardSkeleton key={i} />)}
        </div>
      </div>
    </SPage>
  );
}
