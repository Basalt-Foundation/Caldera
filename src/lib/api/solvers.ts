import { request } from './client';
import type { SolverInfoResponse } from '@/lib/types/api';

export function getSolvers(): Promise<SolverInfoResponse[]> {
  return request<SolverInfoResponse[]>('/v1/solvers');
}

export function getPendingIntents(): Promise<{
  count: number;
  intentHashes: string[];
}> {
  return request<{ count: number; intentHashes: string[] }>(
    '/v1/dex/intents/pending',
  );
}
