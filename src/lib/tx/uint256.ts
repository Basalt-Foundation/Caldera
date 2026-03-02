const MAX_UINT256 = (1n << 256n) - 1n;

/**
 * Immutable 256-bit unsigned integer backed by BigInt.
 * All arithmetic is clamped to the range [0, 2^256 - 1].
 */
export class UInt256 {
  readonly value: bigint;

  constructor(value: bigint | string | number | Uint8Array) {
    if (value instanceof Uint8Array) {
      this.value = UInt256.decodeLittleEndian(value);
    } else {
      const v = BigInt(value);
      this.value = UInt256.clamp(v);
    }
  }

  // ---------------------------------------------------------------------------
  // Static constructors
  // ---------------------------------------------------------------------------

  static readonly ZERO = new UInt256(0n);
  static readonly ONE = new UInt256(1n);

  static fromBytes(bytes: Uint8Array): UInt256 {
    return new UInt256(bytes);
  }

  // ---------------------------------------------------------------------------
  // Serialisation
  // ---------------------------------------------------------------------------

  /** Returns a 32-byte Uint8Array in little-endian order. */
  toBytes(): Uint8Array {
    const buf = new Uint8Array(32);
    let v = this.value;
    for (let i = 0; i < 32; i++) {
      buf[i] = Number(v & 0xffn);
      v >>= 8n;
    }
    return buf;
  }

  /** Decimal string representation. */
  toString(): string {
    return this.value.toString(10);
  }

  /** 0x-prefixed hexadecimal string (64 chars, zero-padded). */
  toHex(): string {
    return '0x' + this.value.toString(16).padStart(64, '0');
  }

  /** Returns the underlying BigInt. */
  toBigInt(): bigint {
    return this.value;
  }

  // ---------------------------------------------------------------------------
  // Predicates
  // ---------------------------------------------------------------------------

  isZero(): boolean {
    return this.value === 0n;
  }

  // ---------------------------------------------------------------------------
  // Arithmetic (returns new UInt256)
  // ---------------------------------------------------------------------------

  add(other: UInt256): UInt256 {
    return new UInt256(UInt256.clamp(this.value + other.value));
  }

  sub(other: UInt256): UInt256 {
    return new UInt256(UInt256.clamp(this.value - other.value));
  }

  mul(other: UInt256): UInt256 {
    return new UInt256(UInt256.clamp(this.value * other.value));
  }

  div(other: UInt256): UInt256 {
    if (other.value === 0n) throw new Error('UInt256: division by zero');
    return new UInt256(this.value / other.value);
  }

  mod(other: UInt256): UInt256 {
    if (other.value === 0n) throw new Error('UInt256: modulo by zero');
    return new UInt256(this.value % other.value);
  }

  // ---------------------------------------------------------------------------
  // Comparisons
  // ---------------------------------------------------------------------------

  eq(other: UInt256): boolean {
    return this.value === other.value;
  }

  gt(other: UInt256): boolean {
    return this.value > other.value;
  }

  lt(other: UInt256): boolean {
    return this.value < other.value;
  }

  gte(other: UInt256): boolean {
    return this.value >= other.value;
  }

  lte(other: UInt256): boolean {
    return this.value <= other.value;
  }

  // ---------------------------------------------------------------------------
  // Static helpers
  // ---------------------------------------------------------------------------

  static min(a: UInt256, b: UInt256): UInt256 {
    return a.lte(b) ? a : b;
  }

  static max(a: UInt256, b: UInt256): UInt256 {
    return a.gte(b) ? a : b;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private static clamp(v: bigint): bigint {
    if (v < 0n) return 0n;
    if (v > MAX_UINT256) return MAX_UINT256;
    return v;
  }

  private static decodeLittleEndian(bytes: Uint8Array): bigint {
    let result = 0n;
    for (let i = bytes.length - 1; i >= 0; i--) {
      result = (result << 8n) | BigInt(bytes[i]);
    }
    return UInt256.clamp(result);
  }
}
