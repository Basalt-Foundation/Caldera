/**
 * Transaction signing for Basalt.
 * Uses BLAKE3 for hashing and Ed25519 for signatures.
 */

import { blake3 } from '@noble/hashes/blake3.js';
import { sign, getPublicKey } from '@/lib/crypto/ed25519';
import {
  writeByte,
  writeUint32LE,
  writeUint64LE,
  writeUInt256LE,
  writeAddress,
  writeVarInt,
  varIntSize,
  bytesToHex,
} from './encoder';

/**
 * An unsigned transaction ready for signing.
 */
export interface UnsignedTransaction {
  type: number;
  nonce: number;
  sender: string;
  to: string;
  value: bigint;
  gasLimit: number;
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  data: Uint8Array;
  priority: number;
  chainId: number;
  complianceProofsHash?: Uint8Array;
}

/**
 * Result of signing a transaction.
 */
export interface SignedResult {
  signature: string; // hex-encoded 64-byte Ed25519 signature
  publicKey: string; // hex-encoded 32-byte Ed25519 public key
}

/**
 * Build the exact binary signing payload from a transaction.
 *
 * Signing payload order:
 *   Type(1B) + Nonce(8B LE) + Sender(20B) + To(20B) + Value(32B LE) +
 *   GasLimit(8B LE) + GasPrice(32B LE) + MaxFeePerGas(32B LE) +
 *   MaxPriorityFeePerGas(32B LE) + DataLength(LEB128 varint) + Data(variable) +
 *   Priority(1B) + ChainId(4B LE) + ComplianceProofsHash(32B, zero if none)
 */
export function buildSigningPayload(tx: UnsignedTransaction): Uint8Array {
  const dataLen = tx.data.length;
  const varIntLen = varIntSize(dataLen);

  // Fixed size: 1 + 8 + 20 + 20 + 32 + 8 + 32 + 32 + 32 + varInt + data + 1 + 4 + 32
  const totalSize = 1 + 8 + 20 + 20 + 32 + 8 + 32 + 32 + 32 + varIntLen + dataLen + 1 + 4 + 32;
  const buf = new Uint8Array(totalSize);
  let offset = 0;

  // Type (1 byte)
  writeByte(buf, offset, tx.type);
  offset += 1;

  // Nonce (8 bytes LE)
  writeUint64LE(buf, offset, BigInt(tx.nonce));
  offset += 8;

  // Sender (20 bytes)
  writeAddress(buf, offset, tx.sender);
  offset += 20;

  // To (20 bytes)
  writeAddress(buf, offset, tx.to);
  offset += 20;

  // Value (32 bytes LE)
  writeUInt256LE(buf, offset, tx.value);
  offset += 32;

  // GasLimit (8 bytes LE)
  writeUint64LE(buf, offset, BigInt(tx.gasLimit));
  offset += 8;

  // GasPrice (32 bytes LE)
  writeUInt256LE(buf, offset, tx.gasPrice);
  offset += 32;

  // MaxFeePerGas (32 bytes LE)
  writeUInt256LE(buf, offset, tx.maxFeePerGas);
  offset += 32;

  // MaxPriorityFeePerGas (32 bytes LE)
  writeUInt256LE(buf, offset, tx.maxPriorityFeePerGas);
  offset += 32;

  // DataLength (LEB128 varint)
  const varIntWritten = writeVarInt(buf, offset, dataLen);
  offset += varIntWritten;

  // Data (variable)
  buf.set(tx.data, offset);
  offset += dataLen;

  // Priority (1 byte)
  writeByte(buf, offset, tx.priority);
  offset += 1;

  // ChainId (4 bytes LE)
  writeUint32LE(buf, offset, tx.chainId);
  offset += 4;

  // ComplianceProofsHash (32 bytes, zero if none)
  if (tx.complianceProofsHash && tx.complianceProofsHash.length === 32) {
    buf.set(tx.complianceProofsHash, offset);
  }
  // else: already zero-filled
  offset += 32;

  return buf;
}

/**
 * Sign a transaction with an Ed25519 private key.
 * Builds the signing payload and signs it directly with Ed25519.
 * (Ed25519 internally handles SHA-512 hashing; no pre-hash needed.)
 *
 * @param tx - The unsigned transaction
 * @param privateKey - 32-byte Ed25519 private key
 * @returns The hex-encoded signature and public key
 */
export function signTransaction(
  tx: UnsignedTransaction,
  privateKey: Uint8Array,
): SignedResult {
  const payload = buildSigningPayload(tx);
  const signature = sign(payload, privateKey);
  const publicKey = getPublicKey(privateKey);

  return {
    signature: bytesToHex(signature, true),
    publicKey: bytesToHex(publicKey, true),
  };
}

/**
 * Compute the BLAKE3 hash of a transaction's signing payload.
 *
 * @param tx - The unsigned transaction
 * @returns 0x-prefixed hex string of the 32-byte hash
 */
export function hashTransaction(tx: UnsignedTransaction): string {
  const payload = buildSigningPayload(tx);
  const hash = blake3(payload);
  return bytesToHex(hash, true);
}
