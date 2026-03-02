import { request } from './client';
import type {
  DexPoolResponse,
  DexOrderResponse,
  DexTwapResponse,
  DexPriceHistoryResponse,
} from '@/lib/types/api';

export function getPools(): Promise<DexPoolResponse[]> {
  return request<DexPoolResponse[]>('/v1/dex/pools');
}

export function getPool(id: number): Promise<DexPoolResponse> {
  return request<DexPoolResponse>(`/v1/dex/pools/${id}`);
}

export function getPoolOrders(id: number): Promise<DexOrderResponse[]> {
  return request<DexOrderResponse[]>(`/v1/dex/pools/${id}/orders`);
}

export function getPoolTwap(
  id: number,
  window = 100,
): Promise<DexTwapResponse> {
  return request<DexTwapResponse>(`/v1/dex/pools/${id}/twap?window=${window}`);
}

export function getPriceHistory(
  id: number,
  startBlock: number,
  endBlock: number,
  interval: number,
): Promise<DexPriceHistoryResponse> {
  return request<DexPriceHistoryResponse>(
    `/v1/dex/pools/${id}/price-history?startBlock=${startBlock}&endBlock=${endBlock}&interval=${interval}`,
  );
}
