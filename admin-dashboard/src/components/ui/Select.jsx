import { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export const Select = forwardRef(({
  label,
  name,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  searchable = false,
  clearable = false,
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (option) => {
    // Create a synthetic event-like object for compatibility
    const syntheticEvent = {
      target: { name, value: option.value },
      currentTarget: { name, value: option.value },
    };
    onChange?.(syntheticEvent);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    const syntheticEvent = {
      target: { name, value: '' },
      currentTarget: { name, value: '' },
    };
    onChange?.(syntheticEvent);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2
          px-4 py-2.5 text-sm text-left
          bg-[var(--bg-input)] rounded-lg border
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen
            ? 'border-primary-500 ring-2 ring-primary-500/20'
            : error
              ? 'border-error-500'
              : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }
        `}
        {...props}
      >
        <span className={selectedOption ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {clearable && value && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="
          absolute z-50 w-full mt-1
          bg-[var(--bg-card)] rounded-lg border border-[var(--border-primary)]
          shadow-lg overflow-hidden animate-fade-in-down
        ">
          {searchable && (
            <div className="p-2 border-b border-[var(--border-primary)]">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="
                  w-full px-3 py-2 text-sm
                  bg-[var(--bg-tertiary)] text-[var(--text-primary)]
                  border border-[var(--border-primary)] rounded-md
                  placeholder:text-[var(--text-muted)]
                  focus:outline-none focus:border-primary-500
                "
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--text-muted)] text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={`
                    w-full flex items-center justify-between gap-2
                    px-4 py-2.5 text-sm text-left
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${option.value === value
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }
                  `}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-primary-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-error-500">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
