import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { ArrowRight, X, Plus } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import ConfirmModal from '../components/ui/ConfirmModal';
import EmptyState from '../components/ui/EmptyState';
import { IdeasPageSkeleton } from '../components/ui/Skeleton';
import { relativeTime } from '../utils/time';

const IDEA_ACCENT = '#f59e0b';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0);   }
`;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 600px;
  margin: 0 auto;
  min-width: 0;
  overflow: hidden;
`;

const CaptureBar = styled.form`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  transition: background 0.15s;

  &:focus-within {
    background: ${({ theme }) => theme.bgCard};
  }
`;

const CaptureInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.text};
  font-size: 0.92rem;
  padding: 0.375rem 0;
  min-height: 2.25rem;

  &:focus { outline: none; }
  &::placeholder { color: ${({ theme }) => theme.textMuted}; opacity: 0.5; }
`;

const IdeaList = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border-top: 1px solid ${({ theme }) => theme.border};
  padding-bottom: 5rem;

  @media (min-width: 768px) {
    padding-bottom: 1rem;
  }
`;

const IdeaRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
  border-left: 2px solid ${IDEA_ACCENT}44;
  animation: ${fadeUp} 0.2s ease both;
  animation-delay: ${({ $i }) => Math.min($i * 30, 250)}ms;
  transition: background 0.15s, border-left-color 0.15s;

  &:hover {
    background: ${({ theme }) => theme.bgCard};
    border-left-color: ${IDEA_ACCENT}aa;
  }

  @media (pointer: fine) {
    padding-right: 6.5rem;
  }
`;

const IdeaBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const IdeaText = styled.p`
  font-size: 0.92rem;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow-wrap: break-word;
  word-break: break-word;
  margin-bottom: 0.25rem;
`;

const IdeaMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const CapturedAt = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.63rem;
  color: ${({ theme }) => theme.textMuted};
  opacity: 0.6;
`;

const TagPill = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.6rem;
  font-weight: 700;
  color: ${IDEA_ACCENT};
  opacity: 0.8;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  opacity: 0.7;

  @media (pointer: fine) {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.15s;
    ${IdeaRow}:hover & { opacity: 1; }
  }
`;

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  height: 2rem;
  padding: 0 0.6rem;
  border-radius: ${({ theme }) => theme.radiusSm};
  border: 1px solid ${({ theme }) => theme.accent};
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.accent};
  transition: background 0.15s, opacity 0.15s;

  &:hover {
    background: ${({ theme }) => theme.accentLight};
    opacity: 1;
  }
`;



export default function Ideas() {
  const navigate = useNavigate();
  const { items: ideas, loading, create, remove } = useResource('ideas');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { document.title = 'Ideas | My Tight Five'; }, []);

  if (loading) return <IdeasPageSkeleton />;

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await create({ text: text.trim(), tags: [] });
      setText('');
    } catch {
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await remove(deleting);
      toast.success('Deleted');
      setDeleting(null);
    } catch {
      toast.error("Couldn't delete");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <Page>
      <PageHeader title="Ideas" back="/" />

      <CaptureBar onSubmit={handleAdd}>
        <CaptureInput
          placeholder="What's the idea?"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <Button type="submit" $loading={saving} disabled={saving || !text.trim()}><Plus size={16} strokeWidth={2} /></Button>
      </CaptureBar>

      <IdeaList>
        {ideas.length === 0 ? (
          <EmptyState />
        ) : ideas.map((idea, i) => {
            const tags = idea.tags?.slice(0, 3) ?? [];
            return (
              <IdeaRow key={idea.id} $i={i}>
                <IdeaBody>
                  <IdeaText>{idea.text}</IdeaText>
                  <IdeaMeta>
                    <CapturedAt>{relativeTime(idea.created_at)}</CapturedAt>
                    {tags.map(t => <TagPill key={t}>#{t}</TagPill>)}
                  </IdeaMeta>
                </IdeaBody>
                <Actions>
                  <ActionBtn onClick={() => navigate('/jokes/new', { state: { fromIdea: idea } })}>
                    <ArrowRight size={12} strokeWidth={2} />joke
                  </ActionBtn>
                  <Button $variant="ghost" $size="sm" onClick={() => setDeleting(idea.id)} aria-label="Delete idea">
                    <X size={14} strokeWidth={2} />
                  </Button>
                </Actions>
              </IdeaRow>
            );
          })}
        </IdeaList>

      {deleting && (
        <ConfirmModal
          title="Delete idea?"
          message="This can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </Page>
  );
}
