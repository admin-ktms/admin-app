import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const DrawerModal: React.FC<DrawerModalProps> = ({
  isOpen,
  title,
  description,
  onClose,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/80 backdrop-blur-sm p-0 lg:p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-xl lg:rounded-xl border border-ktms-border bg-ktms-panel shadow-2xl overflow-hidden pb-safe animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ktms-border px-5 py-4 bg-ktms-surface">
          <div>
            <h3 className="font-bold text-ktms-text text-base">{title}</h3>
            {description && <p className="text-xs text-ktms-muted mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-ktms-border text-ktms-muted hover:text-white transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
