import { request } from './client';
import type {
  TransactionDetailResponse,
  TransactionSubmitResponse,
  ReceiptResponse,
} from '@/lib/types/api';

export interface TransactionRequest {
  type: number;
  nonce: number;
  sender: string;
  to: string;
  value: string;
  gasLimit: number;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  data?: string;
  priority: number;
  chainId: number;
  signature: string;
  senderPublicKey: string;
  complianceProofs?: Array<{
    proofType: string;
    proofData: string;
    nullifier: string;
  }>;
}

export function submitTransaction(
  tx: TransactionRequest,
): Promise<TransactionSubmitResponse> {
  return request<TransactionSubmitResponse>('/v1/transactions', {
    method: 'POST',
    body: JSON.stringify(tx),
  });
}

export function getTransaction(
  hash: string,
): Promise<TransactionDetailResponse> {
  return request<TransactionDetailResponse>(`/v1/transactions/${hash}`);
}

export function getReceipt(hash: string): Promise<ReceiptResponse> {
  return request<ReceiptResponse>(`/v1/receipts/${hash}`);
}

export function getRecentTransactions(
  count = 50,
): Promise<TransactionDetailResponse[]> {
  return request<TransactionDetailResponse[]>(
    `/v1/transactions/recent?count=${count}`,
  );
}
