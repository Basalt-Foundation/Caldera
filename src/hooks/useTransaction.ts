'use client';

import { useState, useCallback, useRef } from 'react';
import { signTransaction, type UnsignedTransaction } from '@/lib/tx/signer';
import { bytesToHex } from '@/lib/tx/encoder';
import {
  submitTransaction,
  getReceipt,
  type TransactionRequest,
} from '@/lib/api/transactions';
import type { ReceiptResponse } from '@/lib/types/api';

export type TransactionStatus =
  | 'idle'
  | 'signing'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'failed';

interface UseTransactionReturn {
  submit: (
    tx: UnsignedTransaction,
    privateKey: Uint8Array,
  ) => Promise<ReceiptResponse | null>;
  isLoading: boolean;
  error: string | null;
  receipt: ReceiptResponse | null;
  txHash: string | null;
  status: TransactionStatus;
  reset: () => void;
}

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 30_000;

/**
 * Hook for building, signing, submitting, and polling for transaction confirmation.
 */
export function useTransaction(): UseTransactionReturn {
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStatus('idle');
    setError(null);
    setReceipt(null);
    setTxHash(null);
  }, []);

  const pollForReceipt = useCallback(
    async (hash: string): Promise<ReceiptResponse | null> => {
      const controller = new AbortController();
      abortRef.current = controller;
      const deadline = Date.now() + POLL_TIMEOUT_MS;

      while (Date.now() < deadline) {
        if (controller.signal.aborted) return null;

        try {
          const result = await getReceipt(hash);
          return result;
        } catch {
          // Receipt not yet available, wait and retry
        }

        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, POLL_INTERVAL_MS);
          controller.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }

      return null;
    },
    [],
  );

  const submit = useCallback(
    async (
      tx: UnsignedTransaction,
      privateKey: Uint8Array,
    ): Promise<ReceiptResponse | null> => {
      try {
        // Sign
        setStatus('signing');
        setError(null);
        setReceipt(null);
        setTxHash(null);

        const { signature, publicKey } = signTransaction(tx, privateKey);

        // Submit
        setStatus('submitting');

        const request: TransactionRequest = {
          type: tx.type,
          nonce: tx.nonce,
          sender: tx.sender,
          to: tx.to,
          value: tx.value.toString(),
          gasLimit: tx.gasLimit,
          gasPrice: tx.gasPrice.toString(),
          maxFeePerGas:
            tx.maxFeePerGas > 0n ? tx.maxFeePerGas.toString() : undefined,
          maxPriorityFeePerGas:
            tx.maxPriorityFeePerGas > 0n
              ? tx.maxPriorityFeePerGas.toString()
              : undefined,
          data:
            tx.data.length > 0
              ? bytesToHex(tx.data, true)
              : undefined,
          priority: tx.priority,
          chainId: tx.chainId,
          signature,
          senderPublicKey: publicKey,
        };

        const response = await submitTransaction(request);
        setTxHash(response.hash);

        // Poll for receipt
        setStatus('confirming');
        const confirmedReceipt = await pollForReceipt(response.hash);

        if (confirmedReceipt) {
          setReceipt(confirmedReceipt);
          setStatus(confirmedReceipt.success ? 'confirmed' : 'failed');
          if (!confirmedReceipt.success) {
            setError(
              confirmedReceipt.errorCode || 'Transaction execution failed',
            );
          }
          return confirmedReceipt;
        } else {
          setStatus('failed');
          setError('Transaction confirmation timed out');
          return null;
        }
      } catch (err) {
        setStatus('failed');
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      }
    },
    [pollForReceipt],
  );

  return {
    submit,
    isLoading:
      status === 'signing' ||
      status === 'submitting' ||
      status === 'confirming',
    error,
    receipt,
    txHash,
    status,
    reset,
  };
}
