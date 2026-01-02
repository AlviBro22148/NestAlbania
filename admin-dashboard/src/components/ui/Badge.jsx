import { forwardRef } from 'react';

const variants = {
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  error: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
  info: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  const dotColors = {
    primary: 'bg-primary-500',
    secondary: 'bg-[var(--text-muted)]',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    info: 'bg-accent-500',
  };

  return (
    <span
      ref={ref}
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

// Status Badge with predefined states
export const StatusBadge = forwardRef(({
  status,
  children,
  className = '',
  ...props
}, ref) => {
  const statusConfig = {
    // User statuses
    active: { variant: 'success', label: 'Active', dot: true },
    inactive: { variant: 'secondary', label: 'Inactive', dot: true },
    banned: { variant: 'error', label: 'Banned', dot: true },
    online: { variant: 'success', label: 'Online', dot: true },
    offline: { variant: 'secondary', label: 'Offline', dot: true },
    // Property statuses
    available: { variant: 'success', label: 'Available', dot: true },
    sold: { variant: 'error', label: 'Sold', dot: true },
    rented: { variant: 'info', label: 'Rented', dot: true },
    pending: { variant: 'warning', label: 'Pending', dot: true },
    // Feedback/Request statuses
    approved: { variant: 'success', label: 'Approved', dot: true },
    rejected: { variant: 'error', label: 'Rejected', dot: true },
    reviewed: { variant: 'info', label: 'Reviewed', dot: true },
    resolved: { variant: 'success', label: 'Resolved', dot: true },
    // Content statuses
    draft: { variant: 'secondary', label: 'Draft', dot: true },
    published: { variant: 'success', label: 'Published', dot: true },
    archived: { variant: 'secondary', label: 'Archived', dot: true },
    // Generic
    success: { variant: 'success', label: 'Success', dot: true },
    error: { variant: 'error', label: 'Error', dot: true },
    warning: { variant: 'warning', label: 'Warning', dot: true },
    info: { variant: 'info', label: 'Info', dot: true },
  };

  const normalizedStatus = status?.toLowerCase();
  const config = statusConfig[normalizedStatus] || { variant: 'secondary', label: status, dot: true };

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      dot={config.dot}
      className={className}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default Badge;
