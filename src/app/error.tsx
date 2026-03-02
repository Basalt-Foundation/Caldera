'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 text-center">
      {/* Error icon */}
      <div
        className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{
          background:
            'radial-gradient(circle, hsla(0, 70%, 55%, 0.12) 0%, hsla(20, 5%, 10%, 1) 70%)',
          border: '1px solid hsla(0, 70%, 55%, 0.2)',
        }}
      >
        <AlertTriangle className="w-10 h-10 text-sell" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
        Something went wrong
      </h1>

      <p className="text-text-secondary max-w-md mb-3">
        An unexpected error occurred. This might be a temporary issue.
      </p>

      {error.message && (
        <div className="rounded-lg bg-sell/5 border border-sell/15 px-4 py-3 mb-8 max-w-md">
          <p className="font-mono text-xs text-sell/80 break-all">
            {error.message}
          </p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button onClick={reset} variant="primary" size="lg">
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="/">Return Home</a>
        </Button>
      </div>
    </div>
  );
}
