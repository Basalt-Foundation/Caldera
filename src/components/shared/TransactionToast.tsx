'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TransactionStatus } from '@/hooks/useTransaction';

interface TransactionToastProps {
  status: TransactionStatus;
  txHash: string | null;
  error: string | null;
  onDismiss?: () => void;
  /** Auto-dismiss delay for success state in ms (default 8000). Set to 0 to disable. */
  autoDismissMs?: number;
}

export function TransactionToast({
  status,
  txHash,
  error,
  onDismiss,
  autoDismissMs = 8_000,
}: TransactionToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'confirmed' && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [status, autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const isPending =
    status === 'signing' || status === 'submitting' || status === 'confirming';

  return (
    <AnimatePresence>
      {visible && status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
        >
          <div
            className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
              isPending
                ? 'border-border bg-surface/95 text-text-primary'
                : status === 'confirmed'
                  ? 'border-green-500/30 bg-green-950/90 text-green-100'
                  : 'border-red-500/30 bg-red-950/90 text-red-100'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {isPending && <Spinner />}
                {status === 'confirmed' && <CheckIcon />}
                {status === 'failed' && <XIcon />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {isPending && statusLabel(status)}
                  {status === 'confirmed' && 'Transaction confirmed'}
                  {status === 'failed' && 'Transaction failed'}
                </p>

                {status === 'confirmed' && txHash && (
                  <a
                    href={`/tx/${txHash}`}
                    className="mt-1 block text-xs text-green-300 hover:text-green-200 truncate underline underline-offset-2"
                  >
                    {txHash}
                  </a>
                )}

                {status === 'failed' && error && (
                  <p className="mt-1 text-xs text-red-300 line-clamp-2">
                    {error}
                  </p>
                )}
              </div>

              {/* Dismiss button */}
              {!isPending && (
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="text-current"
                  >
                    <path
                      d="M1 1L13 13M1 13L13 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function statusLabel(status: TransactionStatus): string {
  switch (status) {
    case 'signing':
      return 'Signing transaction...';
    case 'submitting':
      return 'Submitting transaction...';
    case 'confirming':
      return 'Transaction pending...';
    default:
      return '';
  }
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-accent"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 text-green-400"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-5 w-5 text-red-400"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
