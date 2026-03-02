import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

// Configure ed25519 v3 to use sha512 from @noble/hashes
ed.hashes.sha512 = (...msgs: Uint8Array[]) => {
  const h = sha512.create();
  for (const m of msgs) h.update(m);
  return h.digest();
};

/**
 * Generate a new Ed25519 key pair.
 */
export function generateKeyPair(): {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
} {
  const privateKey = ed.utils.randomSecretKey();
  const publicKey = ed.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/**
 * Derive the Ed25519 public key from a private key.
 */
export function getPublicKey(privateKey: Uint8Array): Uint8Array {
  return ed.getPublicKey(privateKey);
}

/**
 * Sign a message using Ed25519.
 * @returns 64-byte signature
 */
export function sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return ed.sign(message, privateKey);
}

/**
 * Verify an Ed25519 signature.
 */
export function verify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): boolean {
  return ed.verify(signature, message, publicKey);
}

/**
 * Derive a Basalt address from an Ed25519 public key.
 * Keccak-256 hash of the public key, take last 20 bytes, return as 0x-prefixed hex.
 */
export function deriveAddress(publicKey: Uint8Array): string {
  const hash = keccak_256(publicKey);
  const addressBytes = hash.slice(hash.length - 20);
  const hex = Array.from(addressBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hex;
}
