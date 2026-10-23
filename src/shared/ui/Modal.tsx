import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen top-0 left-0 right-0 bottom-0 bg-[#091E42]/50 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 overflow-y-auto z-50 animate-fadeIn"
      style={{ zIndex: 999999 }}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidths[maxWidth]} bg-white border border-[#D9E2EC] rounded-xl shadow-xl overflow-hidden flex flex-col my-auto`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5EAF0] bg-white">
            <h3 className="text-base font-bold text-[#091E42] tracking-tight">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-[#6B778C] hover:text-[#091E42] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[85vh]">{children}</div>
      </div>
    </div>,
    document.body
  );
};
export default Modal;
