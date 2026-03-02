'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/format/amounts';

interface AmountInputProps {
  /** Label displayed above the input (e.g., "You pay", "You receive"). */
  label: string;
  /** Current value as a string. */
  value: string;
  /** Callback when value changes. */
  onChange: (value: string) => void;
  /** Whether the input is read-only. */
  readOnly?: boolean;
  /** Token balance as a raw bigint string (smallest unit). */
  balance?: string | null;
  /** Token decimals for formatting the balance. */
  decimals?: number;
  /** Callback when MAX is clicked. */
  onMax?: () => void;
  /** Content to render on the right side (token selector). */
  tokenSelector?: React.ReactNode;
  /** Whether to show a loading skeleton. */
  loading?: boolean;
  /** Additional CSS classes for the outer container. */
  className?: string;
}

/** Regex to allow valid decimal numbers only. */
const DECIMAL_REGEX = /^[0-9]*\.?[0-9]*$/;

/**
 * Numeric input component for token amounts.
 * Features a large-font input, optional MAX button, balance display,
 * and a slot for a token selector.
 */
export function AmountInput({
  label,
  value,
  onChange,
  readOnly = false,
  balance,
  decimals = 18,
  onMax,
  tokenSelector,
  loading = false,
  className,
}: AmountInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '' || DECIMAL_REGEX.test(raw)) {
        onChange(raw);
      }
    },
    [onChange],
  );

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-surface p-4',
          className,
        )}
      >
        <div className="h-4 w-20 rounded bg-border animate-pulse mb-3" />
        <div className="flex items-center justify-between gap-3">
          <div className="h-8 w-40 rounded bg-border animate-pulse" />
          <div className="h-10 w-28 rounded-lg bg-border animate-pulse" />
        </div>
        <div className="h-3 w-24 rounded bg-border animate-pulse mt-2" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-4 transition-colors',
        'focus-within:border-accent/50',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-text-secondary">{label}</span>
        {balance !== null && balance !== undefined && (
          <div className="flex items-center gap-1 text-xs text-text-tertiary">
            <span>Balance:</span>
            <span className="font-mono tabular-nums">
              {formatTokenAmount(balance, decimals, 4)}
            </span>
            {onMax && !readOnly && (
              <button
                type="button"
                onClick={onMax}
                className="ml-1 text-accent hover:text-accent-hover font-semibold transition-colors"
              >
                MAX
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          className={cn(
            'flex-1 bg-transparent text-2xl font-mono tabular-nums text-text-primary',
            'placeholder:text-text-tertiary outline-none min-w-0',
            readOnly && 'cursor-default',
          )}
        />
        {tokenSelector}
      </div>
    </div>
  );
}
