/**
 * Compute a 4-byte FNV-1a selector for SDK contract methods.
 * This matches the selector scheme used by Basalt's source-generated contract dispatch.
 */
export function computeFnv1aSelector(methodName: string): Uint8Array {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < methodName.length; i++) {
    hash ^= methodName.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0; // FNV prime, ensure unsigned
  }
  // Little-endian 4 bytes
  const buf = new Uint8Array(4);
  buf[0] = hash & 0xff;
  buf[1] = (hash >>> 8) & 0xff;
  buf[2] = (hash >>> 16) & 0xff;
  buf[3] = (hash >>> 24) & 0xff;
  return buf;
}

/**
 * Build calldata for a BST-20 BalanceOf(byte[] account) call.
 * The byte[] parameter uses varint length prefix (BasaltReader.ReadBytes format).
 * Layout: [4B FNV-1a("BalanceOf") LE][varint(20)][20B address]
 */
export function buildBalanceOfCalldata(address: string): Uint8Array {
  const selector = computeFnv1aSelector('BalanceOf');
  const addrBytes = hexToBytes(address);
  // varint(20) = 0x14 (single byte since 20 < 128)
  const calldata = new Uint8Array(4 + 1 + 20);
  calldata.set(selector, 0);
  calldata[4] = addrBytes.length; // varint length prefix
  calldata.set(addrBytes, 5);
  return calldata;
}

/**
 * Build calldata for a BST-20 Symbol() call.
 * Layout: [4B FNV-1a("Symbol") LE]
 */
export function buildSymbolCalldata(): Uint8Array {
  return computeFnv1aSelector('Symbol');
}

/**
 * Build calldata for a BST-20 Decimals() call.
 * Layout: [4B FNV-1a("Decimals") LE]
 */
export function buildDecimalsCalldata(): Uint8Array {
  return computeFnv1aSelector('Decimals');
}

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') || hex.startsWith('0X')
    ? hex.slice(2)
    : hex;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  return bytes;
}
