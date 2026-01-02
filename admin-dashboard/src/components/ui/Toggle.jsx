import { forwardRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const Toggle = forwardRef(({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className = '',
  ...props
}, ref) => {
  const sizes = {
    sm: {
      track: 'w-8 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-3',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <label
      className={`
        inline-flex items-start gap-3
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`
          relative inline-flex shrink-0 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${sizeConfig.track}
          ${checked ? 'bg-primary-600' : 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]'}
        `}
        {...props}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-sm
            transform transition-transform duration-200 ease-in-out
            ${sizeConfig.thumb}
            ${checked ? sizeConfig.translate : 'translate-x-0.5'}
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[var(--text-muted)]">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

Toggle.displayName = 'Toggle';

// Theme Toggle - Sun/Moon switch
export const ThemeToggle = forwardRef(({
  className = '',
  size = 'md',
  ...props
}, ref) => {
  const { isDark, toggleTheme } = useTheme();

  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggleTheme}
      className={`
        relative rounded-lg
        text-[var(--text-secondary)] hover:text-[var(--text-primary)]
        hover:bg-[var(--bg-hover)]
        transition-all duration-200
        ${sizes[size]}
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      {...props}
    >
      <Sun
        className={`
          ${iconSizes[size]}
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          transition-all duration-300
          ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
        `}
      />
      <Moon
        className={`
          ${iconSizes[size]}
          transition-all duration-300
          ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
        `}
      />
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default Toggle;
