import { forwardRef, useState, createContext, useContext } from 'react';

const TabsContext = createContext(undefined);

export const Tabs = forwardRef(({
  defaultValue,
  value,
  onValueChange,
  children,
  className = '',
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

Tabs.displayName = 'Tabs';

export const TabsList = forwardRef(({
  children,
  className = '',
  variant = 'default',
  ...props
}, ref) => {
  const variants = {
    default: 'bg-[var(--bg-tertiary)] p-1 rounded-lg',
    underline: 'border-b border-[var(--border-primary)]',
    pills: 'gap-2',
  };

  return (
    <div
      ref={ref}
      role="tablist"
      className={`flex items-center ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef(({
  value,
  children,
  disabled = false,
  className = '',
  variant = 'default',
  ...props
}, ref) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  const variants = {
    default: `
      ${isActive
        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }
      px-4 py-2 rounded-md
    `,
    underline: `
      ${isActive
        ? 'text-primary-600 border-b-2 border-primary-600'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-b-2 border-transparent'
      }
      px-4 py-3 -mb-px
    `,
    pills: `
      ${isActive
        ? 'bg-primary-600 text-white'
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
      }
      px-4 py-2 rounded-full
    `,
  };

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && context.onValueChange(value)}
      className={`
        text-sm font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef(({
  value,
  children,
  className = '',
  ...props
}, ref) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      className={`animate-fade-in ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

TabsContent.displayName = 'TabsContent';

export default Tabs;
