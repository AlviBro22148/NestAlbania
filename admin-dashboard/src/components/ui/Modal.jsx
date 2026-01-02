import { forwardRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

export const Modal = forwardRef(({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  className = '',
  footer,
  ...props
}, ref) => {
  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape && onClose) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay && onClose) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={`
          relative w-full ${sizes[size]}
          bg-[var(--bg-card)] rounded-xl shadow-xl
          border border-[var(--border-primary)]
          animate-scale-in
          ${className}
        `}
        {...props}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between p-6 border-b border-[var(--border-primary)]">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-[var(--text-primary)]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-[var(--text-secondary)]"
                >
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="
                  p-1.5 rounded-lg
                  text-[var(--text-muted)] hover:text-[var(--text-primary)]
                  hover:bg-[var(--bg-hover)]
                  transition-colors
                "
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border-primary)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

Modal.displayName = 'Modal';

// Confirm Dialog
export const ConfirmDialog = forwardRef(({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  ...props
}, ref) => {
  const variantStyles = {
    danger: 'bg-error-500 hover:bg-error-600 text-white',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white',
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  };

  return (
    <Modal
      ref={ref}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-[var(--bg-tertiary)] text-[var(--text-primary)]
              hover:bg-[var(--bg-hover)]
              transition-colors
              disabled:opacity-50
            "
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg
              transition-colors disabled:opacity-50
              ${variantStyles[variant]}
            `}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </>
      }
      {...props}
    >
      <p className="text-[var(--text-secondary)]">{message}</p>
    </Modal>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

export default Modal;
