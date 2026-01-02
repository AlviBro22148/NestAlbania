import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500',
  secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-secondary)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
  danger: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 focus:ring-error-500',
  success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus:ring-success-500',
  outline: 'bg-transparent border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs rounded',
  sm: 'px-3 py-2 text-sm rounded-md',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-5 py-3 text-base rounded-lg',
  xl: 'px-6 py-3.5 text-lg rounded-xl',
};

const iconSizes = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-5 h-5',
};

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={`animate-spin ${iconSizes[size]}`} />
          {children}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className={iconSizes[size]} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className={iconSizes[size]} />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
