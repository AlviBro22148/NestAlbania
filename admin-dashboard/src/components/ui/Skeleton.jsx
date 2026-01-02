import { forwardRef } from 'react';

export const Skeleton = forwardRef(({
  className = '',
  variant = 'rectangular',
  width,
  height,
  ...props
}, ref) => {
  const variants = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? undefined : '1rem'),
  };

  return (
    <div
      ref={ref}
      className={`
        skeleton animate-shimmer
        bg-gradient-to-r from-[var(--bg-tertiary)] via-[var(--bg-hover)] to-[var(--bg-tertiary)]
        bg-[length:200%_100%]
        ${variants[variant]}
        ${className}
      `}
      style={style}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Skeleton Card
export const SkeletonCard = forwardRef(({
  className = '',
  lines = 3,
  hasImage = false,
  hasAvatar = false,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`
      p-6 rounded-xl
      bg-[var(--bg-card)] border border-[var(--border-primary)]
      ${className}
    `}
    {...props}
  >
    {hasImage && (
      <Skeleton className="w-full h-40 mb-4" />
    )}
    <div className="flex items-center gap-3 mb-4">
      {hasAvatar && (
        <Skeleton variant="circular" width={40} height={40} />
      )}
      <div className="flex-1">
        <Skeleton variant="text" className="w-1/3 mb-2" />
        <Skeleton variant="text" className="w-1/4" height={12} />
      </div>
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={`mb-2 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

// Skeleton Table Row
export const SkeletonTableRow = forwardRef(({
  columns = 4,
  className = '',
  ...props
}, ref) => (
  <tr
    ref={ref}
    className={`border-b border-[var(--border-primary)] ${className}`}
    {...props}
  >
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton variant="text" className={i === 0 ? 'w-3/4' : 'w-1/2'} />
      </td>
    ))}
  </tr>
));

SkeletonTableRow.displayName = 'SkeletonTableRow';

// Skeleton Stats Card
export const SkeletonStatsCard = forwardRef(({
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`
      p-6 rounded-xl
      bg-[var(--bg-card)] border border-[var(--border-primary)]
      ${className}
    `}
    {...props}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <Skeleton variant="text" className="w-24 mb-2" height={14} />
        <Skeleton variant="text" className="w-16 mb-2" height={32} />
        <Skeleton variant="text" className="w-20" height={12} />
      </div>
      <Skeleton className="w-12 h-12 rounded-xl" />
    </div>
  </div>
));

SkeletonStatsCard.displayName = 'SkeletonStatsCard';

export default Skeleton;
