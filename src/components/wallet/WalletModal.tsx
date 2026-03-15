'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Modal } from '@/components/shared/Modal';
import { useWalletStore } from '@/stores/wallet';
import { hasKeystore } from '@/lib/crypto/keystore';
import { formatAddress } from '@/lib/utils';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { isConnected, address, source, extensionDetected } = useWalletStore();

  if (isConnected && address) {
    return (
      <Modal open={open} onOpenChange={onOpenChange} title="Wallet">
        <ConnectedView address={address} source={source} onClose={() => onOpenChange(false)} />
      </Modal>
    );
  }

  const keystoreExists = typeof window !== 'undefined' && hasKeystore();
  const defaultTab = extensionDetected ? 'extension' : keystoreExists ? 'unlock' : 'create';

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Wallet">
      <Tabs.Root defaultValue={defaultTab} className="w-full">
        <Tabs.List className="flex border-b border-border mb-4">
          {extensionDetected && (
            <Tabs.Trigger
              value="extension"
              className="flex-1 px-4 py-2 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent transition-colors"
            >
              Extension
            </Tabs.Trigger>
          )}
          <Tabs.Trigger
            value="create"
            className="flex-1 px-4 py-2 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent transition-colors"
          >
            Create
          </Tabs.Trigger>
          <Tabs.Trigger
            value="import"
            className="flex-1 px-4 py-2 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent transition-colors"
          >
            Import
          </Tabs.Trigger>
          {keystoreExists && (
            <Tabs.Trigger
              value="unlock"
              className="flex-1 px-4 py-2 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent transition-colors"
            >
              Unlock
            </Tabs.Trigger>
          )}
        </Tabs.List>

        {extensionDetected && (
          <Tabs.Content value="extension">
            <ExtensionTab onSuccess={() => onOpenChange(false)} />
          </Tabs.Content>
        )}
        <Tabs.Content value="create">
          <CreateTab onSuccess={() => onOpenChange(false)} />
        </Tabs.Content>
        <Tabs.Content value="import">
          <ImportTab onSuccess={() => onOpenChange(false)} />
        </Tabs.Content>
        {keystoreExists && (
          <Tabs.Content value="unlock">
            <UnlockTab onSuccess={() => onOpenChange(false)} />
          </Tabs.Content>
        )}
      </Tabs.Root>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Connected view — shown when wallet is already unlocked
// ---------------------------------------------------------------------------

function ConnectedView({
  address,
  source,
  onClose,
}: {
  address: string;
  source: 'local' | 'extension' | null;
  onClose: () => void;
}) {
  const { lock, disconnect } = useWalletStore();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLock() {
    lock();
    onClose();
  }

  function handleDisconnect() {
    disconnect();
    onClose();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Source badge */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-buy" />
          {source === 'extension' ? 'Basalt Wallet Extension' : 'Local Wallet'}
        </span>
      </div>

      {/* Address display */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center">
          <span className="text-accent text-lg font-bold">
            {address.slice(2, 4).toUpperCase()}
          </span>
        </div>
        <div className="text-center">
          <p className="text-lg font-mono font-medium text-text-primary">
            {formatAddress(address, 8)}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs text-text-tertiary hover:text-accent transition-colors mt-1"
          >
            {copied ? 'Copied!' : 'Copy full address'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {source === 'local' && (
          <button
            type="button"
            onClick={handleLock}
            className="w-full py-2.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm font-medium transition-colors"
          >
            Lock Wallet
          </button>
        )}
        <button
          type="button"
          onClick={handleDisconnect}
          className="w-full py-2.5 rounded-lg border border-sell/30 text-sell hover:bg-sell/10 text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Extension tab
// ---------------------------------------------------------------------------

function ExtensionTab({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const connectExtension = useWalletStore((s) => s.connectExtension);

  async function handleConnect() {
    setError('');
    setLoading(true);
    try {
      await connectExtension();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 items-center py-4">
      {/* Extension icon */}
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="6" fill="currentColor" className="text-accent/20" />
          <text x="16" y="22" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="bold" className="text-accent">B</text>
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-text-primary">Basalt Wallet Extension</p>
        <p className="text-xs text-text-secondary mt-1">
          Connect your Basalt Wallet to trade securely. Your private keys never leave the extension.
        </p>
      </div>

      {error && <p className="text-sm text-sell">{error}</p>}

      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-background font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Connecting...' : 'Connect Extension'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab forms
// ---------------------------------------------------------------------------

function CreateTab({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const walletCreate = useWalletStore((s) => s.create);

  async function handleCreate() {
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await walletCreate(password);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <InputField
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Enter password (min 8 chars)"
      />
      <InputField
        label="Confirm Password"
        type="password"
        value={confirm}
        onChange={setConfirm}
        placeholder="Confirm password"
      />
      {error && <p className="text-sm text-sell">{error}</p>}
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-background font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Wallet'}
      </button>
    </div>
  );
}

function ImportTab({ onSuccess }: { onSuccess: () => void }) {
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const walletImport = useWalletStore((s) => s.importKey);

  async function handleImport() {
    setError('');
    const clean = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    if (clean.length !== 64 || !/^[0-9a-fA-F]+$/.test(clean)) {
      setError('Invalid private key (must be 64 hex characters)');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await walletImport(privateKey, password);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <InputField
        label="Private Key"
        type="password"
        value={privateKey}
        onChange={setPrivateKey}
        placeholder="0x... (64 hex characters)"
      />
      <InputField
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Encryption password"
      />
      {error && <p className="text-sm text-sell">{error}</p>}
      <button
        type="button"
        onClick={handleImport}
        disabled={loading}
        className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-background font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Importing...' : 'Import Wallet'}
      </button>
    </div>
  );
}

function UnlockTab({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const walletUnlock = useWalletStore((s) => s.unlock);

  async function handleUnlock() {
    setError('');
    setLoading(true);
    try {
      await walletUnlock(password);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Incorrect password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <InputField
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Enter your password"
      />
      {error && <p className="text-sm text-sell">{error}</p>}
      <button
        type="button"
        onClick={handleUnlock}
        disabled={loading}
        className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-background font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Unlocking...' : 'Unlock'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared input
// ---------------------------------------------------------------------------

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none transition-colors"
      />
    </label>
  );
}
