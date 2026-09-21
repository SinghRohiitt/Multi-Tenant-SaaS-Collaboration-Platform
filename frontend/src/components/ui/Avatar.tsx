import { UserRound } from 'lucide-react';
import { cn } from '@/utils/cn';

type AvatarProps = {
  alt?: string;
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeStyles = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' };

export function Avatar({ alt = '', name, src, size = 'md', className }: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return src ? (
    <img
      alt={alt || name || 'Avatar'}
      className={cn('rounded-full object-cover', sizeStyles[size], className)}
      src={src}
    />
  ) : (
    <span
      aria-label={alt || name || 'Avatar'}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-slate-800 font-semibold text-slate-300',
        sizeStyles[size],
        className,
      )}
      role="img"
    >
      {initials || <UserRound aria-hidden="true" className="size-1/2" />}
    </span>
  );
}
