'use client';

import { use } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowLeft, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { getTransaction, getReceipt } from '@/lib/api/transactions';
import { formatTokenAmount } from '@/lib/format/amounts';
import { formatAddress } from '@/lib/utils';

interface PageProps {
  params: Promise<{ hash: string }>;
}

export default function TransactionPage({ params }: PageProps) {
  const { hash } = use(params);

  const { data: tx, error: txError, isLoading: txLoading } = useSWR(
    hash ? `tx:${hash}` : null,
    () => getTransaction(hash),
  );

  const { data: receipt } = useSWR(
    tx?.blockNumber != null ? `receipt:${hash}` : null,
    () => getReceipt(hash),
  );

  if (txLoading) return <TransactionSkeleton />;

  if (txError || !tx) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="text-center py-16">
          <p className="text-text-tertiary text-lg">Transaction not found</p>
          <p className="text-text-tertiary text-sm mt-2 font-mono break-all">{hash}</p>
        </div>
      </div>
    );
  }

  const isPending = tx.blockNumber == null;
  const isSuccess = tx.success === true;
  const isFailed = tx.success === false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Transaction Details</h1>
        {isPending && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-accent/10 text-accent border border-accent/20">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )}
        {isSuccess && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-buy/10 text-buy border border-buy/20">
            <CheckCircle className="w-3 h-3" /> Success
          </span>
        )}
        {isFailed && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-sell/10 text-sell border border-sell/20">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <Row label="Hash">
          <span className="font-mono text-sm break-all text-text-primary">{tx.hash}</span>
        </Row>
        <Row label="Type">
          <span className="text-sm text-text-primary">{tx.type}</span>
        </Row>
        <Row label="Block">
          {tx.blockNumber != null ? (
            <span className="text-sm font-mono text-text-primary">
              #{tx.blockNumber.toLocaleString()}
            </span>
          ) : (
            <span className="text-sm text-text-tertiary">Pending</span>
          )}
        </Row>
        <Row label="From">
          <Link href={`/portfolio?address=${tx.sender}`} className="font-mono text-sm text-accent hover:underline">
            {formatAddress(tx.sender, 10)}
          </Link>
        </Row>
        <Row label="To">
          <Link href={`/portfolio?address=${tx.to}`} className="font-mono text-sm text-accent hover:underline">
            {formatAddress(tx.to, 10)}
          </Link>
        </Row>
        <Row label="Value">
          <span className="text-sm font-mono text-text-primary">
            {formatTokenAmount(tx.value)} BSLT
          </span>
        </Row>
        <Row label="Nonce">
          <span className="text-sm font-mono text-text-primary">{tx.nonce}</span>
        </Row>
        <Row label="Gas Limit">
          <span className="text-sm font-mono text-text-primary">
            {tx.gasLimit.toLocaleString()}
          </span>
        </Row>
        <Row label="Gas Price">
          <span className="text-sm font-mono text-text-primary">
            {formatTokenAmount(tx.gasPrice, 18, 9)} BSLT
          </span>
        </Row>
        {tx.maxFeePerGas && (
          <Row label="Max Fee">
            <span className="text-sm font-mono text-text-primary">
              {formatTokenAmount(tx.maxFeePerGas, 18, 9)} BSLT
            </span>
          </Row>
        )}
        {tx.maxPriorityFeePerGas && (
          <Row label="Priority Fee">
            <span className="text-sm font-mono text-text-primary">
              {formatTokenAmount(tx.maxPriorityFeePerGas, 18, 9)} BSLT
            </span>
          </Row>
        )}
        {receipt && (
          <>
            <Row label="Gas Used">
              <span className="text-sm font-mono text-text-primary">
                {receipt.gasUsed.toLocaleString()}
              </span>
            </Row>
            <Row label="Effective Gas Price">
              <span className="text-sm font-mono text-text-primary">
                {formatTokenAmount(receipt.effectiveGasPrice, 18, 9)} BSLT
              </span>
            </Row>
          </>
        )}
        {isFailed && tx.errorCode && (
          <Row label="Error">
            <span className="text-sm text-sell font-mono">{tx.errorCode}</span>
          </Row>
        )}
        {tx.data && tx.dataSize > 0 && (
          <Row label="Data" last>
            <span className="text-sm font-mono text-text-tertiary break-all">
              {tx.data.length > 200 ? `${tx.data.slice(0, 200)}...` : tx.data}
            </span>
            <span className="text-xs text-text-tertiary ml-2">({tx.dataSize} bytes)</span>
          </Row>
        )}
      </div>

      {receipt && receipt.logs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            Logs ({receipt.logs.length})
          </h2>
          <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border/50">
            {receipt.logs.map((log, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-text-tertiary">#{i}</span>
                  <span className="text-xs font-mono text-accent">{formatAddress(log.contract, 10)}</span>
                </div>
                <p className="text-xs font-mono text-text-secondary">{log.eventSignature}</p>
                {log.topics.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {log.topics.map((topic, j) => (
                      <p key={j} className="text-xs font-mono text-text-tertiary break-all">
                        topic[{j}]: {topic}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 px-4 py-3 ${last ? '' : 'border-b border-border/50'}`}>
      <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider sm:w-40 sm:flex-shrink-0 sm:pt-0.5">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="h-4 w-16 rounded bg-border animate-pulse mb-6" />
      <div className="h-7 w-64 rounded bg-border animate-pulse mb-6" />
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
            <div className="h-3 w-24 rounded bg-border animate-pulse" />
            <div className="h-3 w-48 rounded bg-border animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
