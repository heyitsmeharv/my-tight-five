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
  height: ${({ $h }) => ($h || 12) / 16}rem;
  width: ${({ $w }) => (typeof $w === 'number' ? `${$w / 16}rem` : $w) || '100%'};
`;

/* Single-column joke card skeleton */
const SJokeCard = styled.div`
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-left: 4px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 0.875rem 2.875rem 0.875rem 1rem;
`;

/* Idea list row skeleton */
const SIdeaRow = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
  border-left: 2px solid ${({ theme }) => theme.border};
`;


const SCard = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  background: ${({ theme }) => theme.bgCard};
  padding: 0.875rem 1rem;
  margin-bottom: 0.625rem;
`;

export function JokeCardSkeleton() {
  return (
    <SJokeCard>
      <SkeletonLine $h={15} style={{ marginBottom: '0.4375rem' }} />
      <SkeletonLine $h={15} style={{ marginBottom: '0.625rem', maxWidth: '68%' }} />
      <SkeletonLine $h={12} style={{ marginBottom: '0.75rem', maxWidth: '88%' }} />
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <SkeletonLine $h={20} $w={54} style={{ borderRadius: '99px' }} />
        <SkeletonLine $h={11} $w={38} />
      </div>
    </SJokeCard>
  );
}

export function IdeaRowSkeleton() {
  return (
    <SIdeaRow>
      <div style={{ flex: 1 }}>
        <SkeletonLine $h={13} style={{ marginBottom: '0.375rem' }} />
        <SkeletonLine $h={13} style={{ marginBottom: '0.375rem', maxWidth: '80%' }} />
        <SkeletonLine $h={10} $w={48} />
      </div>
      <div style={{ display: 'flex', gap: '0.25rem', paddingTop: '0.125rem' }}>
        <SkeletonLine $h={24} $w={44} style={{ borderRadius: '0.1875rem' }} />
        <SkeletonLine $h={24} $w={24} style={{ borderRadius: '0.1875rem' }} />
      </div>
    </SIdeaRow>
  );
}


export function SetCardSkeleton() {
  return (
    <SCard>
      <SkeletonLine $h={15} style={{ marginBottom: '0.5rem', maxWidth: '55%' }} />
      <SkeletonLine $h={10} style={{ marginBottom: '0.75rem', maxWidth: '38%' }} />
      <SkeletonLine $h={3} style={{ borderRadius: '2px' }} />
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
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  height: 3.125rem;
`;

const SEditPage = styled.div`
  padding-bottom: 5rem;
  max-width: 600px;
  margin: 0 auto;
`;

const SEditBody = styled.div`
  padding: 1.25rem 1rem;
`;

const SStageRow = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`;

export function JokeEditSkeleton() {
  return (
    <SEditPage>
      <SHeader>
        <SkeletonLine $h={14} $w={24} style={{ flexShrink: 0 }} />
        <SkeletonLine $h={16} style={{ maxWidth: '40%' }} />
      </SHeader>
      <SEditBody>
        <SkeletonLine $h={18} style={{ marginBottom: '0.625rem' }} />
        <SkeletonLine $h={18} style={{ marginBottom: '0.625rem', maxWidth: '75%' }} />
        <SkeletonLine $h={18} style={{ marginBottom: '1.5rem', maxWidth: '50%' }} />
        <SkeletonLine $h={1} style={{ marginBottom: '1rem' }} />
        <SkeletonLine $h={16} style={{ marginBottom: '0.625rem' }} />
        <SkeletonLine $h={16} style={{ marginBottom: '1.5rem', maxWidth: '60%' }} />
        <SStageRow>
          {[70, 55, 80, 60, 65].map((w, i) => (
            <SkeletonLine key={i} $h={26} $w={w} style={{ borderRadius: '99px' }} />
          ))}
        </SStageRow>
      </SEditBody>
    </SEditPage>
  );
}

const SPage = styled.div`
  padding-bottom: 5rem;
  max-width: 600px;
  margin: 0 auto;
`;

const STimingBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SBody = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SJokeRow = styled.div`
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
  background: ${({ theme }) => theme.bgCard};
  border: 1px solid ${({ theme }) => theme.border};
  border-left: 4px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 0.875rem 1rem;
`;

function SJokeCardSkeleton() {
  return (
    <SJokeRow>
      <SkeletonLine $h={14} $w={8} style={{ marginTop: '0.1875rem', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <SkeletonLine $h={14} style={{ marginBottom: '0.4375rem' }} />
        <SkeletonLine $h={14} style={{ marginBottom: '0.625rem', maxWidth: '70%' }} />
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
        <SkeletonLine $h={16} style={{ maxWidth: '40%' }} />
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <SkeletonLine $h={30} $w={56} style={{ borderRadius: '0.375rem', flexShrink: 0 }} />
          <SkeletonLine $h={30} $w={52} style={{ borderRadius: '0.375rem', flexShrink: 0 }} />
          <SkeletonLine $h={30} $w={72} style={{ borderRadius: '0.375rem', flexShrink: 0 }} />
        </div>
      </SHeader>
      <STimingBar>
        <SkeletonLine $h={12} $w={60} />
        <SkeletonLine $h={6} style={{ flex: 1 }} />
        <SkeletonLine $h={12} $w={52} />
      </STimingBar>
      <SBody>
        {[0, 1, 2].map(i => <SJokeCardSkeleton key={i} />)}
      </SBody>
    </SPage>
  );
}

const SFiltersBar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  overflow-x: auto;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SCaptureBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SIdeaList = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const SDashHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
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
  padding: 1rem 0.5rem;
  gap: 0.375rem;
  &:not(:last-child) { border-right: 1px solid ${({ theme }) => theme.border}; }
`;

const SQuickCapture = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem;
  margin-bottom: 0.5rem;
`;

const SSectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

export function JokesPageSkeleton() {
  return (
    <SPage>
      <SHeader>
        <SkeletonLine $h={14} $w={24} style={{ flexShrink: 0 }} />
        <SkeletonLine $h={16} style={{ maxWidth: '30%' }} />
        <SkeletonLine $h={30} $w={72} style={{ marginLeft: 'auto', borderRadius: '0.375rem', flexShrink: 0 }} />
      </SHeader>
      <SFiltersBar>
        {[38, 52, 58, 68].map((w, i) => (
          <SkeletonLine key={i} $h={28} $w={w} style={{ borderRadius: '99px', flexShrink: 0 }} />
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
        <SkeletonLine $h={30} $w={80} style={{ marginLeft: 'auto', borderRadius: '0.375rem', flexShrink: 0 }} />
      </SHeader>
      <div style={{ padding: '1rem' }}>
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
        <SkeletonLine $h={36} $w={36} style={{ flexShrink: 0, borderRadius: '0.375rem' }} />
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
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  height: 3.0625rem;
`;

const SReadContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
  max-width: 720px;
  width: 100%;
  align-self: center;
`;

const SReadNav = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border-top: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.bg};
`;

const SPunchlineBlock = styled.div`
  border-left: 3px solid ${({ theme }) => theme.primary};
  padding-left: 1rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export function SetReadThroughSkeleton() {
  return (
    <SReadPage>
      <STopBar>
        <SkeletonLine $h={14} $w={130} />
        <SkeletonLine $h={12} $w={40} />
        <SkeletonLine $h={24} $w={24} style={{ borderRadius: '0.25rem' }} />
      </STopBar>
      <SReadContent>
        <SkeletonLine $h={13} $w={52} style={{ marginBottom: '0.75rem' }} />
        <SkeletonLine $h={26} style={{ marginBottom: '0.625rem' }} />
        <SkeletonLine $h={26} style={{ marginBottom: '1.25rem', maxWidth: '68%' }} />
        <SPunchlineBlock>
          <SkeletonLine $h={20} />
          <SkeletonLine $h={20} style={{ maxWidth: '80%' }} />
        </SPunchlineBlock>
      </SReadContent>
      <SReadNav>
        <SkeletonLine $h={48} style={{ flex: 1, borderRadius: '0.375rem' }} />
        <SkeletonLine $h={48} style={{ flex: 1, borderRadius: '0.375rem' }} />
      </SReadNav>
    </SReadPage>
  );
}

const SPracticeOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.bg};
  z-index: 200;
  display: flex;
  flex-direction: column;
`;

const SPracticeTopBar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem 0;
  flex-shrink: 0;
`;

const SPracticeBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 2.5rem;
  gap: 0;
`;

const SPracticeJoke = styled.div`
  display: flex;
  flex-direction: column;
  width: min(720px, 90vw);
  text-align: left;
  margin-top: 1.5rem;
`;

const SPracticeNav = styled.div`
  flex-shrink: 0;
  display: flex;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

export function SetPracticeOverlaySkeleton() {
  return (
    <SPracticeOverlay>
      <SPracticeTopBar>
        <SkeletonLine $h={24} $w={24} style={{ borderRadius: '0.25rem' }} />
      </SPracticeTopBar>
      <SPracticeBody>
        {/* Timer */}
        <SkeletonLine $h={96} $w={260} style={{ borderRadius: '0.5rem', marginBottom: '0.75rem' }} />
        {/* Target */}
        <SkeletonLine $h={22} $w={110} style={{ marginBottom: '2rem' }} />
        {/* Joke section */}
        <SPracticeJoke>
          <SkeletonLine $h={16} $w={90} style={{ marginBottom: '1rem' }} />
          <SkeletonLine $h={26} style={{ marginBottom: '0.625rem' }} />
          <SkeletonLine $h={26} style={{ marginBottom: '1.25rem', maxWidth: '72%' }} />
          <SPunchlineBlock>
            <SkeletonLine $h={20} />
            <SkeletonLine $h={20} style={{ maxWidth: '78%' }} />
          </SPunchlineBlock>
        </SPracticeJoke>
      </SPracticeBody>
      <SPracticeNav>
        <SkeletonLine $h={48} style={{ flex: 1, borderRadius: '0.375rem' }} />
        <SkeletonLine $h={48} style={{ flex: 1, borderRadius: '0.375rem' }} />
      </SPracticeNav>
    </SPracticeOverlay>
  );
}

const SVideoCard = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  background: ${({ theme }) => theme.bgCard};
  margin-bottom: 0.75rem;
  overflow: hidden;
`;

export function ShowreelPageSkeleton() {
  return (
    <SPage style={{ maxWidth: '700px' }}>
      <SHeader>
        <SkeletonLine $h={14} $w={24} style={{ flexShrink: 0 }} />
        <SkeletonLine $h={16} style={{ maxWidth: '25%' }} />
      </SHeader>
      <div style={{ padding: '1rem' }}>
        <SCard style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <SkeletonLine $h={14} $w={14} style={{ flexShrink: 0 }} />
          <SkeletonLine $h={12} style={{ flex: 1 }} />
          <SkeletonLine $h={28} $w={90} style={{ borderRadius: '0.375rem', flexShrink: 0 }} />
        </SCard>
        <SkeletonLine $h={100} style={{ borderRadius: '0.5rem', marginBottom: '1.25rem' }} />
        {[0, 1].map(i => (
          <SVideoCard key={i}>
            <SkeletonLine $h={180} style={{ borderRadius: 0 }} />
            <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <SkeletonLine $h={14} style={{ flex: 1 }} />
              <SkeletonLine $h={28} $w={72} style={{ borderRadius: '0.375rem', flexShrink: 0 }} />
              <SkeletonLine $h={28} $w={32} style={{ borderRadius: '0.375rem', flexShrink: 0 }} />
            </div>
          </SVideoCard>
        ))}
      </div>
    </SPage>
  );
}

export function DashboardSkeleton() {
  return (
    <SPage>
      <SDashHeader>
        <SkeletonLine $h={18} $w={110} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <SkeletonLine $h={30} $w={52} style={{ borderRadius: '0.375rem' }} />
          <SkeletonLine $h={30} $w={72} style={{ borderRadius: '0.375rem' }} />
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
        <SkeletonLine $h={38} $w={38} style={{ flexShrink: 0, borderRadius: '0.375rem' }} />
      </SQuickCapture>
      <div style={{ padding: '0 1rem' }}>
        <SSectionHead>
          <SkeletonLine $h={14} $w={90} />
          <SkeletonLine $h={14} $w={28} />
        </SSectionHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {[0, 1, 2].map(i => <JokeCardSkeleton key={i} />)}
        </div>
      </div>
    </SPage>
  );
}
