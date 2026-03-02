'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/stores/settings';
import { cn } from '@/lib/utils';

const SLIPPAGE_PRESETS = [10, 50, 100, 300] as const;

/**
 * Settings popover for slippage tolerance and transaction deadline.
 */
export function SwapSettings() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const slippageBps = useSettingsStore((s) => s.slippageBps);
  const deadlineBlocks = useSettingsStore((s) => s.deadlineBlocks);
  const setSlippage = useSettingsStore((s) => s.setSlippage);
  const setDeadline = useSettingsStore((s) => s.setDeadline);

  const [customSlippage, setCustomSlippage] = useState('');
  const isCustom = !SLIPPAGE_PRESETS.includes(slippageBps as typeof SLIPPAGE_PRESETS[number]);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleCustomSlippageChange = (value: string) => {
    setCustomSlippage(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
      setSlippage(Math.round(parsed * 100));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          open
            ? 'text-accent bg-accent/10'
            : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-hover',
        )}
        aria-label="Swap settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-surface p-4 shadow-xl z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">
                Transaction Settings
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slippage Tolerance */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-2 block">
                Slippage Tolerance
              </label>
              <div className="flex gap-2">
                {SLIPPAGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSlippage(preset);
                      setCustomSlippage('');
                    }}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                      slippageBps === preset
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-background text-text-secondary hover:border-text-tertiary',
                    )}
                  >
                    {(preset / 100).toFixed(1)}%
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Custom"
                  value={isCustom ? (slippageBps / 100).toString() : customSlippage}
                  onChange={(e) => handleCustomSlippageChange(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/50"
                />
                <span className="text-xs text-text-tertiary">%</span>
              </div>
              {slippageBps > 500 && (
                <p className="mt-1.5 text-xs text-warning">
                  High slippage may result in an unfavorable trade
                </p>
              )}
            </div>

            {/* Transaction Deadline */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block">
                Transaction Deadline
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={deadlineBlocks}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      setDeadline(val);
                    }
                  }}
                  className="w-24 bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-text-primary outline-none focus:border-accent/50"
                />
                <span className="text-xs text-text-tertiary">blocks</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
