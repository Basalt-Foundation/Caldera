/**
 * The Basalt Wallet browser extension, when the visitor has it.
 *
 * The extension injects a provider on `window.basalt` at document start. Talking to it rather than
 * asking for a second wallet matters: a keystore in localStorage is a key the page can read, and
 * someone who already installed the official wallet has no reason to make another one to use this site.
 */

/** What the extension puts on the window. Only the parts this app uses are described. */
export interface BasaltProvider {
  readonly isBasalt: boolean;
  readonly connected: boolean;
  readonly accounts: string[];
  /** Resolves with the granted accounts and the chain they are on, not a bare list. */
  connect(): Promise<{ accounts: string[]; chainId: number }>;
  /**
   * What this site was already granted, without prompting.
   *
   * connect() asks the person; this asks the wallet what it already decided. A page reload is not a
   * new introduction, and treating it as one interrupts someone who already said yes.
   */
  getAccounts(): Promise<string[]>;
  disconnect(): Promise<void>;
  /**
   * Builds, signs and broadcasts. The wallet chooses the nonce and the chain, which is why this is
   * the whole transaction rather than a signature handed back for the page to submit: a signature
   * over the wallet's nonce does not fit a transaction the page assembled with its own.
   */
  sendTransaction(tx: {
    type?: number;
    to: string;
    value?: string;
    gasLimit?: number;
    data?: string;
  }): Promise<{ hash: string }>;
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
}

declare global {
  interface Window {
    basalt?: BasaltProvider;
  }
}

/** The provider, or null when the extension is not installed. */
export function getExtensionProvider(): BasaltProvider | null {
  if (typeof window === 'undefined') return null;
  const provider = window.basalt;
  return provider?.isBasalt ? provider : null;
}

/**
 * Whether the extension is present.
 *
 * Read at the moment it is asked rather than cached, because the content script injects at document
 * start but a visitor can install the extension without reloading the page.
 */
export function hasExtension(): boolean {
  return getExtensionProvider() !== null;
}
