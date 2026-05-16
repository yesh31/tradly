import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
}

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Backdrop = styled(motion.div)`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled(motion.div)<{ $size: ModalSize }>`
  position: relative;
  width: 100%;
  max-width: ${({ $size }) => {
    switch ($size) {
      case 'sm': return '24rem';
      case 'md': return '32rem';
      case 'lg': return '42rem';
    }
  }};
  background-color: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  box-shadow: 8px 8px 0px ${({ theme }) => theme.colors.border};
  max-height: 85vh;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding: 1rem 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const ModalBody = styled.div`
  overflow-y: auto;
  padding: 1.5rem;
`;

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Overlay initial="hidden" animate="visible" exit="hidden">
          <Backdrop variants={backdropVariants} onClick={onClose} />
          <ModalContent $size={size} variants={modalVariants}>
            <ModalHeader>
              {title && <Title>{title}</Title>}
              <CloseButton onClick={onClose} aria-label="Close modal">
                <CloseIcon />
              </CloseButton>
            </ModalHeader>
            <ModalBody>{children}</ModalBody>
          </ModalContent>
        </Overlay>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default Modal;
