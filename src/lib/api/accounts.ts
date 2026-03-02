import { request } from './client';
import type {
  AccountResponse,
  TransactionDetailResponse,
} from '@/lib/types/api';

export function getAccount(addr: string): Promise<AccountResponse> {
  return request<AccountResponse>(`/v1/accounts/${addr}`);
}

export function getAccountTransactions(
  addr: string,
  count = 25,
): Promise<TransactionDetailResponse[]> {
  return request<TransactionDetailResponse[]>(
    `/v1/accounts/${addr}/transactions?count=${count}`,
  );
}
