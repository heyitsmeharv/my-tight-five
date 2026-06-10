import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import Button from './Button';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1.5rem;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  padding: 1.5rem;
  max-width: 22.5rem;
  width: 100%;
  box-shadow: ${({ theme }) => theme.shadowMd};
  outline: none;
`;

const Title = styled.h3`
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const Message = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 1.25rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  ${({ $stacked }) => $stacked
    ? 'flex-direction: column;'
    : 'justify-content: flex-end;'}
`;

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', dangerous = true, loading = false, secondaryAction }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    modalRef.current?.focus();
    return () => prev?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') { onCancel(); return; }
      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <Overlay onClick={onCancel}>
      <Modal ref={modalRef} tabIndex={-1} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <Title id="modal-title">{title}</Title>
        <Message>{message}</Message>
        <Actions $stacked={!!secondaryAction}>
          <Button $variant={dangerous ? 'danger' : 'primary'} $size="sm" onClick={onConfirm} $loading={loading} disabled={loading || secondaryAction?.loading}>{confirmLabel}</Button>
          {secondaryAction && (
            <Button $variant="ghost" $size="sm" onClick={secondaryAction.onClick} disabled={loading || secondaryAction.loading}>
              {secondaryAction.label}
            </Button>
          )}
          <Button $variant="ghost" $size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
        </Actions>
      </Modal>
    </Overlay>
  );
}
