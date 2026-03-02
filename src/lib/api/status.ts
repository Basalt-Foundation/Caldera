import { request } from './client';
import type { StatusResponse } from '@/lib/types/api';

export function getStatus(): Promise<StatusResponse> {
  return request<StatusResponse>('/v1/status');
}
