/** Type declarations for the window.basalt provider injected by the Basalt Wallet extension. */

export interface BasaltProvider {
  readonly isBasalt: true;
  connected: boolean;
  accounts: string[];
  chainId: number | null;

  connect(): Promise<{ accounts: string[]; chainId: number }>;
  disconnect(): Promise<void>;
  signTransaction(tx: Record<string, unknown>): Promise<{ signature: string; hash: string }>;
  sendTransaction(tx: Record<string, unknown>): Promise<{ hash: string }>;
  signMessage(message: string | Uint8Array): Promise<{ signature: string }>;
  getBalance(address?: string): Promise<string>;
  getChainId(): Promise<number>;
  request(args: { method: string; params?: unknown }): Promise<unknown>;

  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    basalt?: BasaltProvider;
  }
}
