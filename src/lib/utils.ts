import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a hex address for display, showing first `chars` and last 4 characters.
 */
export function formatAddress(addr: string, chars: number = 6): string {
  if (!addr || addr.length < chars + 4) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-4)}`;
}
