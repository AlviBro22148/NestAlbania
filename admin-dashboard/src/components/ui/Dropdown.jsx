import { forwardRef, useState, useRef, useEffect } from 'react';
import { MoreVertical, MoreHorizontal } from 'lucide-react';

export const Dropdown = forwardRef(({
  trigger,
  children,
  align = 'right',
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignments = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`} {...props}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 min-w-[180px]
            bg-[var(--bg-card)] rounded-lg border border-[var(--border-primary)]
            shadow-lg py-1
            animate-fade-in-down
            ${alignments[align]}
          `}
        >
          {typeof children === 'function'
            ? children({ close: () => setIsOpen(false) })
            : children
          }
        </div>
      )}
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

// Dropdown Item
export const DropdownItem = forwardRef(({
  children,
  icon: Icon,
  onClick,
  disabled = false,
  danger = false,
  className = '',
  ...props
}, ref) => (
  <button
    ref={ref}
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
      transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed
      ${danger
        ? 'text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20'
        : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      }
      ${className}
    `}
    {...props}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </button>
));

DropdownItem.displayName = 'DropdownItem';

// Dropdown Divider
export const DropdownDivider = forwardRef(({ className = '', ...props }, ref) => (
  <hr
    ref={ref}
    className={`my-1 border-[var(--border-primary)] ${className}`}
    {...props}
  />
));

DropdownDivider.displayName = 'DropdownDivider';

// Dropdown Label
export const DropdownLabel = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`px-4 py-2 text-xs font-semibold uppercase text-[var(--text-muted)] ${className}`}
    {...props}
  >
    {children}
  </div>
));

DropdownLabel.displayName = 'DropdownLabel';

// Actions Dropdown (common pattern)
export const ActionsDropdown = forwardRef(({
  items = [],
  variant = 'vertical',
  className = '',
  ...props
}, ref) => {
  const Icon = variant === 'vertical' ? MoreVertical : MoreHorizontal;

  return (
    <Dropdown
      ref={ref}
      trigger={
        <button
          type="button"
          className="
            p-2 rounded-lg
            text-[var(--text-muted)] hover:text-[var(--text-primary)]
            hover:bg-[var(--bg-hover)]
            transition-colors
          "
        >
          <Icon className="w-5 h-5" />
        </button>
      }
      className={className}
      {...props}
    >
      {({ close }) => (
        <>
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return <DropdownDivider key={index} />;
            }
            if (item.type === 'label') {
              return <DropdownLabel key={index}>{item.label}</DropdownLabel>;
            }
            return (
              <DropdownItem
                key={index}
                icon={item.icon}
                danger={item.danger}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  close();
                }}
              >
                {item.label}
              </DropdownItem>
            );
          })}
        </>
      )}
    </Dropdown>
  );
});

ActionsDropdown.displayName = 'ActionsDropdown';

export default Dropdown;
