'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { descalePriceToNumber } from '@/lib/constants';
import { useTwap } from '@/hooks/useTwap';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { cn } from '@/lib/utils';

interface PriceChartProps {
  /** TWAP spot price as string (fallback when no history). */
  spotPrice: string | null;
  /** Pool ID for historical data fetching. */
  poolId: number;
  className?: string;
}

const TIME_RANGES = [
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '30m', seconds: 1_800 },
  { label: '1h', seconds: 3_600 },
  { label: '6h', seconds: 21_600 },
  { label: '12h', seconds: 43_200 },
  { label: '24h', seconds: 86_400 },
  { label: '3d', seconds: 259_200 },
  { label: '7d', seconds: 604_800 },
  { label: '30d', seconds: 2_592_000 },
  { label: '3mo', seconds: 7_776_000 },
] as const;

type RangeLabel = (typeof TIME_RANGES)[number]['label'];

/**
 * Price chart using TradingView Lightweight Charts with time-range filters.
 * Fetches real historical TWAP data from the price-history API endpoint.
 * Falls back to spot-price line if no history is available.
 */
export function PriceChart({ spotPrice, poolId, className }: PriceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [chartError, setChartError] = useState(false);
  const [selectedRange, setSelectedRange] = useState<RangeLabel>('1h');

  const { twap } = useTwap(poolId);
  const currentBlock = twap?.currentBlock ?? 0;
  const blockTimeMs = 2000; // 2s block time

  const rangeConfig = useMemo(() => {
    const range = TIME_RANGES.find((r) => r.label === selectedRange)!;
    const blockTimeSec = blockTimeMs / 1000;
    const totalBlocks = Math.ceil(range.seconds / blockTimeSec);
    const start = currentBlock > totalBlocks ? currentBlock - totalBlocks : 0;
    const interval = Math.max(1, Math.floor(totalBlocks / 200));
    return { startBlock: start, endBlock: currentBlock, interval };
  }, [selectedRange, currentBlock, blockTimeMs]);

  const { priceHistory, isLoading: historyLoading } = usePriceHistory(
    currentBlock > 0 ? poolId : undefined,
    currentBlock > 0 ? rangeConfig.startBlock : undefined,
    currentBlock > 0 ? rangeConfig.endBlock : undefined,
    currentBlock > 0 ? rangeConfig.interval : undefined,
  );

  // Map API points to chart data
  const chartData = useMemo(() => {
    if (priceHistory && priceHistory.points.length > 0) {
      const mapped = priceHistory.points
        .map((p) => ({
          time: p.timestamp as import('lightweight-charts').UTCTimestamp,
          value: descalePriceToNumber(p.price),
        }))
        .filter((p) => !isNaN(p.value) && p.value > 0);
      if (mapped.length > 0) return mapped;
    }

    // Fallback: generate a flat line at the spot price across the time range
    if (spotPrice) {
      const price = descalePriceToNumber(spotPrice);
      if (!isNaN(price) && price > 0) {
        const now = Math.floor(Date.now() / 1000);
        const range = TIME_RANGES.find((r) => r.label === selectedRange)!;
        const startTime = now - range.seconds;
        const numPoints = 50;
        const step = range.seconds / numPoints;
        return Array.from({ length: numPoints + 1 }, (_, i) => ({
          time: Math.floor(startTime + i * step) as import('lightweight-charts').UTCTimestamp,
          value: price,
        }));
      }
    }

    return [];
  }, [priceHistory, spotPrice, selectedRange]);

  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) return;

    let disposed = false;

    async function initChart() {
      try {
        const { createChart, LineStyle } = await import('lightweight-charts');
        if (disposed || !chartRef.current) return;

        const chart = createChart(chartRef.current, {
          width: chartRef.current.clientWidth,
          height: 300,
          layout: {
            background: { color: 'transparent' },
            textColor: 'hsl(30, 5%, 55%)',
            fontFamily: 'var(--font-mono), monospace',
          },
          grid: {
            vertLines: { color: 'hsl(20, 5%, 14%)' },
            horzLines: { color: 'hsl(20, 5%, 14%)' },
          },
          crosshair: {
            vertLine: { color: 'hsl(33, 95%, 50%)', width: 1, style: LineStyle.Dashed },
            horzLine: { color: 'hsl(33, 95%, 50%)', width: 1, style: LineStyle.Dashed },
          },
          rightPriceScale: {
            borderColor: 'hsl(20, 5%, 18%)',
          },
          timeScale: {
            borderColor: 'hsl(20, 5%, 18%)',
          },
        });

        const { LineSeries } = await import('lightweight-charts');
        const lineSeries = chart.addSeries(LineSeries, {
          color: 'hsl(33, 95%, 50%)',
          lineWidth: 2,
          priceLineVisible: true,
          priceLineColor: 'hsl(33, 95%, 50%)',
        });

        lineSeries.setData(chartData);
        chart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            chart.resize(entry.contentRect.width, 300);
          }
        });
        resizeObserver.observe(chartRef.current);

        setChartLoaded(true);

        return () => {
          disposed = true;
          resizeObserver.disconnect();
          chart.remove();
        };
      } catch {
        if (!disposed) setChartError(true);
      }
    }

    setChartLoaded(false);
    const cleanup = initChart();
    return () => {
      disposed = true;
      cleanup?.then((fn) => fn?.());
    };
  }, [chartData]);

  if (chartError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-[300px] rounded-xl border border-border bg-surface',
          className,
        )}
      >
        <p className="text-sm text-text-tertiary">No price data available</p>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-xl border border-border bg-surface overflow-hidden', className)}>
      {/* Time range filter bar */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-1 overflow-x-auto">
        {TIME_RANGES.map((range) => (
          <button
            key={range.label}
            onClick={() => setSelectedRange(range.label)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
              selectedRange === range.label
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {(!chartLoaded || historyLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
          <Loader2 className="w-6 h-6 text-text-tertiary animate-spin" />
        </div>
      )}

      {/* Chart container */}
      {chartData.length > 0 ? (
        <div ref={chartRef} className="w-full" />
      ) : (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-text-tertiary">
            {historyLoading ? 'Loading price data...' : 'No price data available'}
          </p>
        </div>
      )}
    </div>
  );
}
