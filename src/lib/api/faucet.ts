import { request } from './client';
import type { FaucetResponse } from '@/lib/types/api';

export function requestDrip(address: string): Promise<FaucetResponse> {
  return request<FaucetResponse>('/v1/faucet', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}

export function getFaucetStatus(): Promise<{
  available: boolean;
  nextDripAt: number;
}> {
  return request<{ available: boolean; nextDripAt: number }>(
    '/v1/faucet/status',
  );
}
