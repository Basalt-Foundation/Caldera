import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceImpactProps {
  /** Price impact in basis points (100 bps = 1%). */
  impactBps: number;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Display price impact with color-coded severity.
 *
 * - < 100 bps (1%): green
 * - 100-300 bps (1-3%): yellow/amber
 * - 300-500 bps (3-5%): orange
 * - > 500 bps (5%): red with warning icon
 */
export function PriceImpact({ impactBps, className }: PriceImpactProps) {
  const pct = (impactBps / 100).toFixed(2);
  const severity = getSeverity(impactBps);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {severity === 'critical' && (
        <AlertTriangle className="w-3.5 h-3.5 text-sell shrink-0" />
      )}
      <span
        className={cn(
          'text-xs font-mono tabular-nums',
          severity === 'low' && 'text-buy',
          severity === 'medium' && 'text-warning',
          severity === 'high' && 'text-accent',
          severity === 'critical' && 'text-sell font-semibold',
        )}
      >
        {impactBps <= 0 ? '<0.01' : pct}%
      </span>
      <span className="text-xs text-text-tertiary">price impact</span>
    </div>
  );
}

type Severity = 'low' | 'medium' | 'high' | 'critical';

function getSeverity(bps: number): Severity {
  if (bps < 100) return 'low';
  if (bps < 300) return 'medium';
  if (bps < 500) return 'high';
  return 'critical';
}
