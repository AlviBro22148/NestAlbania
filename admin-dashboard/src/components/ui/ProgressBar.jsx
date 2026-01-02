import { forwardRef } from 'react';

const variants = {
  primary: 'bg-primary-600',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  accent: 'bg-accent-500',
};

const sizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
  xl: 'h-4',
};

export const ProgressBar = forwardRef(({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  animated = false,
  className = '',
  ...props
}, ref) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div ref={ref} className={`w-full ${className}`} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm text-[var(--text-secondary)]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`
          w-full rounded-full overflow-hidden
          bg-[var(--bg-tertiary)]
          ${sizes[size]}
        `}
      >
        <div
          className={`
            h-full rounded-full transition-all duration-500 ease-out
            ${variants[variant]}
            ${animated ? 'animate-pulse-soft' : ''}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

// Circular Progress
export const CircularProgress = forwardRef(({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = true,
  strokeWidth,
  className = '',
  ...props
}, ref) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: { dimension: 48, stroke: 4, fontSize: 'text-xs' },
    md: { dimension: 64, stroke: 6, fontSize: 'text-sm' },
    lg: { dimension: 96, stroke: 8, fontSize: 'text-lg' },
    xl: { dimension: 128, stroke: 10, fontSize: 'text-2xl' },
  };

  const variantColors = {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#f43f5e',
    accent: '#3b82f6',
  };

  const sizeConfig = sizes[size];
  const radius = (sizeConfig.dimension - (strokeWidth || sizeConfig.stroke)) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      ref={ref}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: sizeConfig.dimension, height: sizeConfig.dimension }}
      {...props}
    >
      <svg
        className="transform -rotate-90"
        width={sizeConfig.dimension}
        height={sizeConfig.dimension}
      >
        {/* Background circle */}
        <circle
          cx={sizeConfig.dimension / 2}
          cy={sizeConfig.dimension / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth || sizeConfig.stroke}
        />
        {/* Progress circle */}
        <circle
          cx={sizeConfig.dimension / 2}
          cy={sizeConfig.dimension / 2}
          r={radius}
          fill="none"
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth || sizeConfig.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <span className={`absolute font-semibold text-[var(--text-primary)] ${sizeConfig.fontSize}`}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
});

CircularProgress.displayName = 'CircularProgress';

// Loading Spinner
export const Spinner = forwardRef(({
  size = 'md',
  variant = 'primary',
  className = '',
  ...props
}, ref) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variantColors = {
    primary: 'text-primary-600',
    white: 'text-white',
    muted: 'text-[var(--text-muted)]',
  };

  return (
    <svg
      ref={ref}
      className={`animate-spin ${sizes[size]} ${variantColors[variant]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
});

Spinner.displayName = 'Spinner';

export default ProgressBar;
