import { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Search } from 'lucide-react';

export const Input = forwardRef(({
  label,
  error,
  success,
  hint,
  icon: Icon,
  iconPosition = 'left',
  type = 'text',
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const hasLeftIcon = Icon && iconPosition === 'left';
  const hasRightIcon = Icon && iconPosition === 'right' || isPassword || error || success;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {hasLeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 text-sm
            bg-[var(--bg-input)] text-[var(--text-primary)]
            border rounded-lg
            transition-all duration-150
            placeholder:text-[var(--text-muted)]
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasLeftIcon ? 'pl-10' : ''}
            ${hasRightIcon ? 'pr-10' : ''}
            ${error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
              : success
                ? 'border-success-500 focus:border-success-500 focus:ring-success-500/20'
                : 'border-[var(--border-primary)] focus:border-primary-500 focus:ring-primary-500/20'
            }
            ${inputClassName}
          `}
          {...props}
        />
        {(hasRightIcon) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {error && <AlertCircle className="w-5 h-5 text-error-500" />}
            {success && !error && <CheckCircle className="w-5 h-5 text-success-500" />}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            )}
            {Icon && iconPosition === 'right' && !isPassword && !error && !success && (
              <Icon className="w-5 h-5 text-[var(--text-muted)]" />
            )}
          </div>
        )}
      </div>
      {(error || hint) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-error-500' : 'text-[var(--text-muted)]'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Search Input variant
export const SearchInput = forwardRef(({
  placeholder = 'Search...',
  className = '',
  ...props
}, ref) => (
  <Input
    ref={ref}
    type="search"
    placeholder={placeholder}
    icon={Search}
    iconPosition="left"
    className={className}
    {...props}
  />
));

SearchInput.displayName = 'SearchInput';

// Textarea variant
export const Textarea = forwardRef(({
  label,
  error,
  hint,
  className = '',
  rows = 4,
  required = false,
  disabled = false,
  ...props
}, ref) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
    )}
    <textarea
      ref={ref}
      rows={rows}
      disabled={disabled}
      className={`
        w-full px-4 py-2.5 text-sm
        bg-[var(--bg-input)] text-[var(--text-primary)]
        border rounded-lg resize-none
        transition-all duration-150
        placeholder:text-[var(--text-muted)]
        focus:outline-none focus:ring-2 focus:ring-offset-0
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error
          ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
          : 'border-[var(--border-primary)] focus:border-primary-500 focus:ring-primary-500/20'
        }
      `}
      {...props}
    />
    {(error || hint) && (
      <p className={`mt-1.5 text-xs ${error ? 'text-error-500' : 'text-[var(--text-muted)]'}`}>
        {error || hint}
      </p>
    )}
  </div>
));

Textarea.displayName = 'Textarea';

export default Input;
