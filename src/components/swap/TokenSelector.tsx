'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { truncateAddress, isValidAddress } from '@/lib/format/addresses';
import { formatTokenAmount } from '@/lib/format/amounts';
import { useAccount } from '@/hooks/useAccount';
import { useWalletStore } from '@/stores/wallet';
import { usePools } from '@/hooks/usePools';
import { KNOWN_TOKENS, getKnownToken } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TokenSelectorProps {
  selected: string;
  onSelect: (address: string) => void;
  excludeAddress?: string;
  className?: string;
}

/** Display label for a token address — symbol if known, truncated address otherwise. */
function tokenLabel(address: string): string {
  const known = getKnownToken(address);
  return known ? known.symbol : truncateAddress(address);
}

export function TokenSelector({
  selected,
  onSelect,
  excludeAddress,
  className,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { pools } = usePools();
  const walletAddress = useWalletStore((s) => s.address);
  const isConnected = useWalletStore((s) => s.isConnected);

  // Merge well-known tokens + tokens discovered from pools
  const allTokens = useMemo(() => {
    const tokenSet = new Set<string>(
      KNOWN_TOKENS.map((t) => t.address.toLowerCase()),
    );
    for (const pool of pools) {
      tokenSet.add(pool.token0.toLowerCase());
      tokenSet.add(pool.token1.toLowerCase());
    }
    if (excludeAddress) {
      tokenSet.delete(excludeAddress.toLowerCase());
    }
    // Sort: known tokens first (by their index), then the rest alphabetically
    return Array.from(tokenSet).sort((a, b) => {
      const aKnown = KNOWN_TOKENS.findIndex(
        (t) => t.address.toLowerCase() === a,
      );
      const bKnown = KNOWN_TOKENS.findIndex(
        (t) => t.address.toLowerCase() === b,
      );
      if (aKnown !== -1 && bKnown !== -1) return aKnown - bKnown;
      if (aKnown !== -1) return -1;
      if (bKnown !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [pools, excludeAddress]);

  // Filter by search (match address or symbol/name)
  const filteredTokens = useMemo(() => {
    if (!search.trim()) return allTokens;
    const q = search.toLowerCase().trim();
    return allTokens.filter((addr) => {
      if (addr.includes(q)) return true;
      const known = getKnownToken(addr);
      if (known) {
        return (
          known.symbol.toLowerCase().includes(q) ||
          known.name.toLowerCase().includes(q)
        );
      }
      return false;
    });
  }, [allTokens, search]);

  const handleSelect = (address: string) => {
    onSelect(address);
    setOpen(false);
    setSearch('');
  };

  const handlePasteAndSelect = () => {
    const trimmed = search.trim();
    if (isValidAddress(trimmed)) {
      handleSelect(trimmed);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-xl px-3 py-2 transition-colors shrink-0',
          'border border-border bg-background hover:bg-surface-hover',
          selected ? 'text-text-primary' : 'text-text-secondary',
          className,
        )}
      >
        {selected ? (
          <>
            <TokenIcon address={selected} size="sm" />
            <span className="text-sm font-semibold">{tokenLabel(selected)}</span>
          </>
        ) : (
          <span className="text-sm">Select token</span>
        )}
        <ChevronDown className="w-4 h-4 text-text-tertiary" />
      </button>

      <Modal open={open} onOpenChange={setOpen} title="Select a Token">
        <div className="space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search name or paste address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePasteAndSelect();
              }}
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/50"
              autoFocus
            />
          </div>

          {/* Paste custom address hint */}
          {search.trim() &&
            isValidAddress(search.trim()) &&
            !allTokens.includes(search.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={handlePasteAndSelect}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors"
              >
                <TokenIcon address={search.trim()} size="md" />
                <div className="text-left">
                  <p className="text-sm font-mono text-text-primary">
                    {truncateAddress(search.trim())}
                  </p>
                  <p className="text-xs text-accent">Use custom address</p>
                </div>
              </button>
            )}

          {/* Token list */}
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {filteredTokens.length === 0 && (
              <p className="text-center text-sm text-text-tertiary py-8">
                No tokens found
              </p>
            )}
            {filteredTokens.map((address) => (
              <TokenRow
                key={address}
                address={address}
                isSelected={address.toLowerCase() === selected.toLowerCase()}
                walletAddress={walletAddress}
                isConnected={isConnected}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}

interface TokenRowProps {
  address: string;
  isSelected: boolean;
  walletAddress: string | null;
  isConnected: boolean;
  onSelect: (address: string) => void;
}

function TokenRow({
  address,
  isSelected,
  walletAddress,
  isConnected,
  onSelect,
}: TokenRowProps) {
  const known = getKnownToken(address);
  const { account } = useAccount(
    isConnected && walletAddress ? walletAddress : undefined,
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(address)}
      disabled={isSelected}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors',
        isSelected
          ? 'bg-accent/10 border border-accent/30 cursor-default'
          : 'hover:bg-surface-hover border border-transparent',
      )}
    >
      <TokenIcon address={address} size="md" />
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-text-primary">
          {known ? known.symbol : truncateAddress(address)}
        </p>
        {known && (
          <p className="text-xs text-text-tertiary">{known.name}</p>
        )}
        {!known && (
          <p className="text-xs font-mono text-text-tertiary">
            {truncateAddress(address, 8, 6)}
          </p>
        )}
      </div>
      {isConnected && account && known?.symbol === 'BSLT' && (
        <span className="text-xs font-mono text-text-tertiary tabular-nums">
          {formatTokenAmount(account.balance, 18, 4)}
        </span>
      )}
    </button>
  );
}
