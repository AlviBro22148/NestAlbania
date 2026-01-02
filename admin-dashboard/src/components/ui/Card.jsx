import { forwardRef } from 'react';

export const Card = forwardRef(({
  children,
  className = '',
  hover = false,
  glass = false,
  padding = 'md',
  ...props
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      ref={ref}
      className={`
        bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)]
        shadow-sm transition-all duration-200
        ${hover ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--border-focus)] cursor-pointer' : ''}
        ${glass ? 'glass' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`flex items-center justify-between mb-4 ${className}`}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(({
  children,
  className = '',
  as: Component = 'h3',
  ...props
}, ref) => (
  <Component
    ref={ref}
    className={`text-lg font-semibold text-[var(--text-primary)] ${className}`}
    {...props}
  >
    {children}
  </Component>
));

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <p
    ref={ref}
    className={`text-sm text-[var(--text-secondary)] ${className}`}
    {...props}
  >
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={className}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-primary)] ${className}`}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

// Stats Card with gradient background
export const StatsCard = forwardRef(({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'primary',
  className = '',
  ...props
}, ref) => {
  const variants = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    error: 'from-error-500 to-error-600',
    accent: 'from-accent-500 to-accent-600',
  };

  const trendColors = {
    up: 'text-success-500',
    down: 'text-error-500',
    neutral: 'text-[var(--text-muted)]',
  };

  return (
    <div
      ref={ref}
      className={`
        relative overflow-hidden rounded-xl p-6
        bg-[var(--bg-card)] border border-[var(--border-primary)]
        shadow-sm hover:shadow-md transition-all duration-200
        ${className}
      `}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-[var(--text-primary)] animate-count-up">
            {value}
          </p>
          {(trend || trendLabel) && (
            <div className="flex items-center gap-1 mt-2">
              {trend && (
                <span className={`text-sm font-medium ${trendColors[trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral']}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
              {trendLabel && (
                <span className="text-xs text-[var(--text-muted)]">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${variants[variant]} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
});

StatsCard.displayName = 'StatsCard';

export default Card;
