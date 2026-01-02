import { forwardRef, useState } from 'react';
import { User } from 'lucide-react';

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const statusPositions = {
  xs: 'w-1.5 h-1.5 -bottom-0 -right-0',
  sm: 'w-2 h-2 -bottom-0.5 -right-0.5',
  md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
  lg: 'w-3 h-3 -bottom-0.5 -right-0.5',
  xl: 'w-3.5 h-3.5 -bottom-1 -right-1',
  '2xl': 'w-4 h-4 -bottom-1 -right-1',
};

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-gray-400 dark:bg-gray-600',
  busy: 'bg-error-500',
  away: 'bg-warning-500',
};

export const Avatar = forwardRef(({
  src,
  alt = '',
  name,
  size = 'md',
  status,
  className = '',
  ...props
}, ref) => {
  const [imageError, setImageError] = useState(false);

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Generate a consistent color based on name
  const getColorFromName = (name) => {
    if (!name) return 'bg-primary-500';
    const colors = [
      'bg-primary-500',
      'bg-accent-500',
      'bg-success-500',
      'bg-warning-500',
      'bg-error-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-teal-500',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const showImage = src && !imageError;
  const showInitials = !showImage && name;
  const showFallback = !showImage && !showInitials;

  return (
    <div
      ref={ref}
      className={`relative inline-flex ${className}`}
      {...props}
    >
      <div
        className={`
          relative flex items-center justify-center rounded-full overflow-hidden
          ${sizes[size]}
          ${showInitials ? getColorFromName(name) : 'bg-[var(--bg-tertiary)]'}
        `}
      >
        {showImage && (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        {showInitials && (
          <span className="font-medium text-white">
            {getInitials(name)}
          </span>
        )}
        {showFallback && (
          <User className="w-1/2 h-1/2 text-[var(--text-muted)]" />
        )}
      </div>
      {status && (
        <span
          className={`
            absolute rounded-full border-2 border-[var(--bg-card)]
            ${statusPositions[size]}
            ${statusColors[status]}
          `}
        />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

// Avatar Group
export const AvatarGroup = forwardRef(({
  avatars = [],
  max = 4,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);

  const overlapSizes = {
    xs: '-ml-2',
    sm: '-ml-2.5',
    md: '-ml-3',
    lg: '-ml-4',
    xl: '-ml-5',
    '2xl': '-ml-6',
  };

  return (
    <div
      ref={ref}
      className={`flex items-center ${className}`}
      {...props}
    >
      {visibleAvatars.map((avatar, index) => (
        <div
          key={avatar.id || index}
          className={`${index > 0 ? overlapSizes[size] : ''} ring-2 ring-[var(--bg-card)] rounded-full`}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            size={size}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            ${overlapSizes[size]} flex items-center justify-center rounded-full
            ${sizes[size]}
            bg-[var(--bg-tertiary)] text-[var(--text-secondary)]
            ring-2 ring-[var(--bg-card)] font-medium
          `}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
});

AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;
