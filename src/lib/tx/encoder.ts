/**
 * Binary encoding utilities for Basalt transaction serialization.
 * UInt256 amounts use little-endian. Integer IDs and ticks use big-endian
 * to match the C# TransactionExecutor's BinaryPrimitives.Read*BigEndian calls.
 */

/** Write a single byte at the given offset. */
export function writeByte(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = value & 0xff;
}

/** Write a 16-bit unsigned integer in little-endian at the given offset. */
export function writeUint16LE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
}

/** Write a 32-bit unsigned integer in little-endian at the given offset. */
export function writeUint32LE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
  buf[offset + 2] = (value >>> 16) & 0xff;
  buf[offset + 3] = (value >>> 24) & 0xff;
}

/** Write a 64-bit unsigned integer in little-endian at the given offset. */
export function writeUint64LE(buf: Uint8Array, offset: number, value: bigint): void {
  const v = BigInt.asUintN(64, value);
  for (let i = 0; i < 8; i++) {
    buf[offset + i] = Number((v >> BigInt(i * 8)) & 0xffn);
  }
}

/** Write a 32-bit signed integer in little-endian at the given offset. */
export function writeInt32LE(buf: Uint8Array, offset: number, value: number): void {
  // Use DataView for correct signed integer handling
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  view.setInt32(offset, value, true);
}

/** Write a 32-bit unsigned integer in big-endian at the given offset. */
export function writeUint32BE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

/** Write a 64-bit unsigned integer in big-endian at the given offset. */
export function writeUint64BE(buf: Uint8Array, offset: number, value: bigint): void {
  const v = BigInt.asUintN(64, value);
  for (let i = 0; i < 8; i++) {
    buf[offset + (7 - i)] = Number((v >> BigInt(i * 8)) & 0xffn);
  }
}

/** Write a 32-bit signed integer in big-endian at the given offset. */
export function writeInt32BE(buf: Uint8Array, offset: number, value: number): void {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  view.setInt32(offset, value, false);
}

/** Write a 256-bit unsigned integer in little-endian (32 bytes) at the given offset. */
export function writeUInt256LE(buf: Uint8Array, offset: number, value: bigint): void {
  let v = BigInt.asUintN(256, value);
  for (let i = 0; i < 32; i++) {
    buf[offset + i] = Number(v & 0xffn);
    v >>= 8n;
  }
}

/** Write a 20-byte address from a hex string at the given offset. */
export function writeAddress(buf: Uint8Array, offset: number, hexAddr: string): void {
  const bytes = hexToBytes(hexAddr);
  if (bytes.length !== 20) {
    throw new Error(`Invalid address length: expected 20 bytes, got ${bytes.length}`);
  }
  buf.set(bytes, offset);
}

/**
 * Write a variable-length integer using LEB128 encoding.
 * Returns the number of bytes written.
 */
export function writeVarInt(buf: Uint8Array, offset: number, value: number): number {
  let v = value >>> 0; // ensure unsigned 32-bit
  let bytesWritten = 0;
  do {
    let byte = v & 0x7f;
    v >>>= 7;
    if (v !== 0) {
      byte |= 0x80;
    }
    buf[offset + bytesWritten] = byte;
    bytesWritten++;
  } while (v !== 0);
  return bytesWritten;
}

/** Calculate the LEB128 encoded size of a value. */
export function varIntSize(value: number): number {
  let v = value >>> 0;
  let size = 0;
  do {
    v >>>= 7;
    size++;
  } while (v !== 0);
  return size;
}

/** Convert a hex string (with or without 0x prefix) to a Uint8Array. */
export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') || hex.startsWith('0X')
    ? hex.slice(2)
    : hex;
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  return bytes;
}

/** Convert a Uint8Array to a hex string, with optional 0x prefix. */
export function bytesToHex(bytes: Uint8Array, prefix = false): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return prefix ? '0x' + hex : hex;
}
