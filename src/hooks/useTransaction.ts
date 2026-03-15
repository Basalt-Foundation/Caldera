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
import { useWalletStore } from '@/stores/wallet';

export type TransactionStatus =
  | 'idle'
  | 'signing'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'failed';

interface UseTransactionReturn {
  /** Submit a transaction. If connected via extension, privateKey is ignored (pass any Uint8Array). */
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
 * Automatically routes through the Basalt Wallet extension when connected via extension.
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
      let delay = POLL_INTERVAL_MS;

      while (Date.now() < deadline) {
        if (controller.signal.aborted) return null;

        try {
          const result = await getReceipt(hash);
          return result;
        } catch {
          // Receipt not yet available, wait and retry with backoff
        }

        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, delay);
          controller.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve();
          });
        });
        delay = Math.min(delay * 2, 8_000); // Exponential backoff, cap at 8s
      }

      return null;
    },
    [],
  );

  const submitViaExtension = useCallback(
    async (tx: UnsignedTransaction): Promise<ReceiptResponse | null> => {
      const provider = window.basalt;
      if (!provider) throw new Error('Basalt Wallet extension not available');

      // Send the transaction through the extension.
      // The extension handles signing, nonce management, and broadcasting.
      setStatus('signing');
      setError(null);
      setReceipt(null);
      setTxHash(null);

      const txPayload: Record<string, unknown> = {
        to: tx.to,
        value: tx.value.toString(),
        gasLimit: tx.gasLimit,
        data: tx.data.length > 0 ? bytesToHex(tx.data, true) : undefined,
      };

      // Route by transaction type
      // Types 7-20 are DEX operations → use tx_dex
      // Type 2 is ContractCall → use tx_contract_call
      // Default → use tx_send
      let method: string;
      if (tx.type >= 7 && tx.type <= 20) {
        method = 'tx_dex';
        // For DEX ops, the extension expects the raw data + operation metadata
        txPayload.type = tx.type;
      } else if (tx.type === 2) {
        method = 'tx_contract_call';
        txPayload.data = tx.data.length > 0 ? Array.from(tx.data) : undefined;
      } else {
        method = 'tx_send';
      }

      setStatus('submitting');
      const result = await provider.sendTransaction({
        method,
        ...txPayload,
      });

      const hash = result.hash;
      setTxHash(hash);

      // Poll for receipt
      setStatus('confirming');
      const confirmedReceipt = await pollForReceipt(hash);

      if (confirmedReceipt) {
        setReceipt(confirmedReceipt);
        setStatus(confirmedReceipt.success ? 'confirmed' : 'failed');
        if (!confirmedReceipt.success) {
          setError(confirmedReceipt.errorCode || 'Transaction execution failed');
        }
        return confirmedReceipt;
      } else {
        setStatus('failed');
        setError('Transaction confirmation timed out');
        return null;
      }
    },
    [pollForReceipt],
  );

  const submitLocal = useCallback(
    async (
      tx: UnsignedTransaction,
      privateKey: Uint8Array,
    ): Promise<ReceiptResponse | null> => {
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
    },
    [pollForReceipt],
  );

  const submit = useCallback(
    async (
      tx: UnsignedTransaction,
      privateKey: Uint8Array,
    ): Promise<ReceiptResponse | null> => {
      try {
        const { source } = useWalletStore.getState();

        if (source === 'extension') {
          return await submitViaExtension(tx);
        }

        return await submitLocal(tx, privateKey);
      } catch (err) {
        setStatus('failed');
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      }
    },
    [submitViaExtension, submitLocal],
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
