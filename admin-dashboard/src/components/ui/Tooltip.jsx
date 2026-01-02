import { forwardRef, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const Tooltip = forwardRef(({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const positions = {
          top: {
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
          },
          bottom: {
            top: rect.bottom + 8,
            left: rect.left + rect.width / 2,
          },
          left: {
            top: rect.top + rect.height / 2,
            left: rect.left - 8,
          },
          right: {
            top: rect.top + rect.height / 2,
            left: rect.right + 8,
          },
        };
        setCoords(positions[position]);
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--bg-card)] border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--bg-card)] border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--bg-card)] border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--bg-card)] border-y-transparent border-l-transparent',
  };

  if (!content) {
    return children;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
        {...props}
      >
        {children}
      </div>

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[100] pointer-events-none animate-fade-in"
          style={{
            top: coords.top,
            left: coords.left,
            transform: position === 'top' || position === 'bottom'
              ? 'translateX(-50%) translateY(-100%)'
              : position === 'left'
                ? 'translateX(-100%) translateY(-50%)'
                : 'translateY(-50%)',
          }}
        >
          <div
            className={`
              relative px-3 py-2 text-xs font-medium
              bg-[var(--bg-card)] text-[var(--text-primary)]
              rounded-lg shadow-lg border border-[var(--border-primary)]
              whitespace-nowrap
              ${className}
            `}
          >
            {content}
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

Tooltip.displayName = 'Tooltip';

// Simple inline tooltip for sidebar items
export const SidebarTooltip = forwardRef(({
  children,
  content,
  show = true,
  className = '',
  ...props
}, ref) => {
  if (!show || !content) {
    return children;
  }

  return (
    <div ref={ref} className={`group relative ${className}`} {...props}>
      {children}
      <div
        className="
          absolute left-full top-1/2 -translate-y-1/2 ml-3
          px-3 py-2 text-sm font-medium
          bg-[var(--bg-card)] text-[var(--text-primary)]
          rounded-lg shadow-lg border border-[var(--border-primary)]
          whitespace-nowrap
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-150
          z-50
        "
      >
        {content}
      </div>
    </div>
  );
});

SidebarTooltip.displayName = 'SidebarTooltip';

export default Tooltip;
