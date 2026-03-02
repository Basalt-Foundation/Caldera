'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  variant?: 'text' | 'card' | 'row' | 'circle';
  className?: string;
}

export function Skeleton({
  width,
  height,
  rounded,
  variant = 'text',
  className,
}: SkeletonProps) {
  const roundedClass = rounded
    ? {
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
      }[rounded]
    : undefined;

  const variantDefaults = {
    text: 'h-4 w-full rounded-md',
    card: 'h-32 w-full rounded-lg',
    row: 'h-12 w-full rounded-md',
    circle: 'h-10 w-10 rounded-full',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-surface',
        'relative overflow-hidden',
        variantDefaults[variant],
        roundedClass,
        className,
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      <div
        className="absolute inset-0 skeleton-shimmer"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, hsla(33, 40%, 50%, 0.08) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}
