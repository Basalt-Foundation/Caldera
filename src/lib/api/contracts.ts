import { request } from './client';
import type { CallRequest, CallResponse } from '@/lib/types/api';

/**
 * Execute a read-only contract call via the node's /v1/call endpoint.
 */
export function callContract(req: CallRequest): Promise<CallResponse> {
  return request<CallResponse>('/v1/call', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}
