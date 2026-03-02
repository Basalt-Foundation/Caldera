import type { BlockResponse } from '@/lib/types/api';

const WS_URL =
  process.env.NEXT_PUBLIC_BASALT_WS_URL || 'ws://localhost:5100';

const MIN_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;

export interface BlockStreamCallbacks {
  onBlock?: (block: BlockResponse) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event | Error) => void;
}

export class BlockStreamClient {
  private ws: WebSocket | null = null;
  private reconnectDelay = MIN_RECONNECT_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;
  private callbacks: BlockStreamCallbacks;

  constructor(callbacks: BlockStreamCallbacks = {}) {
    this.callbacks = callbacks;
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(): void {
    this.shouldReconnect = true;
    this.createConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private createConnection(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    try {
      this.ws = new WebSocket(`${WS_URL}/ws/blocks`);
    } catch (err) {
      this.callbacks.onError?.(err as Error);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = MIN_RECONNECT_DELAY;
      this.callbacks.onConnect?.();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const block = JSON.parse(event.data as string) as BlockResponse;
        this.callbacks.onBlock?.(block);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.callbacks.onDisconnect?.();
      this.scheduleReconnect();
    };

    this.ws.onerror = (event: Event) => {
      this.callbacks.onError?.(event);
    };
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;
    if (this.reconnectTimer !== null) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.createConnection();
    }, this.reconnectDelay);

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s, 30s, ...
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      MAX_RECONNECT_DELAY,
    );
  }
}
