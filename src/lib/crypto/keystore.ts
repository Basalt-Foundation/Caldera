const STORAGE_KEY = 'caldera_keystore';
const PBKDF2_ITERATIONS = 600_000;

interface KeystoreData {
  salt: string;
  iv: string;
  ciphertext: string;
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt a private key with AES-256-GCM + PBKDF2.
 * Returns a JSON string containing hex-encoded salt, iv, and ciphertext.
 */
export async function encryptKeystore(
  privateKey: Uint8Array,
  password: string,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    privateKey as BufferSource,
  );
  const data: KeystoreData = {
    salt: hexEncode(salt),
    iv: hexEncode(iv),
    ciphertext: hexEncode(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(data);
}

/**
 * Decrypt a keystore JSON string back to the private key bytes.
 */
export async function decryptKeystore(
  keystoreJson: string,
  password: string,
): Promise<Uint8Array> {
  const data: KeystoreData = JSON.parse(keystoreJson);
  const salt = hexDecode(data.salt);
  const iv = hexDecode(data.iv);
  const ciphertext = hexDecode(data.ciphertext);
  const key = await deriveKey(password, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );
  return new Uint8Array(plaintext);
}

/**
 * Save a keystore JSON string to localStorage.
 */
export function saveKeystore(keystoreJson: string): void {
  localStorage.setItem(STORAGE_KEY, keystoreJson);
}

/**
 * Load the keystore JSON string from localStorage.
 */
export function loadKeystore(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Check whether a keystore exists in localStorage.
 */
export function hasKeystore(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Remove the keystore from localStorage.
 */
export function clearKeystore(): void {
  localStorage.removeItem(STORAGE_KEY);
}
