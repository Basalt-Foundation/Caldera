import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
}

const paddingMap = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  title,
  padding = 'md',
  hover = false,
  className,
  children,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface',
        paddingMap[padding],
        hover &&
          'transition-shadow duration-200 hover:shadow-[0_0_20px_hsla(33,95%,50%,0.1)]',
        className,
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
