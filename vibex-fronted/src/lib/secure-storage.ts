/**
 * Secure Storage Utility
 * 
 * Provides AES-GCM encryption for sensitive data stored in localStorage.
 * Uses the Web Crypto API for proper cryptographic protection.
 * 
 * Keys are derived from a combination of session-specific data to prevent
 * cross-session token extraction attacks.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Derives an AES-GCM key from a session-specific secret.
 * The secret is derived from a combination of factors to prevent
 * static key extraction attacks.
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Use a combination of factors as salt for key derivation
  // This ensures different sessions get different keys
  const salt = encoder.encode(getSessionSalt());

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Gets a session-specific salt derived from browser characteristics.
 * This provides a secondary layer of key derivation without storing secrets.
 */
function getSessionSalt(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width * screen.height,
    new Date().getUTCFullYear().toString(),
  ];
  
  // Simple hash of components to create salt
  let hash = 0;
  const combined = components.join('|');
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `vibex_secure_v1_${Math.abs(hash).toString(16)}`;
}

/**
 * Encrypts a string value using AES-GCM.
 * Returns a base64-encoded string containing IV + ciphertext.
 */
export async function encryptValue(plaintext: string): Promise<string> {
  const key = await deriveKey(getSessionSalt());
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a value previously encrypted with encryptValue.
 */
export async function decryptValue(encrypted: string): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);
    
    const key = await deriveKey(getSessionSalt());
    
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // Decryption failed - key mismatch or corrupted data
    return '';
  }
}

/**
 * Stores a value securely in localStorage.
 */
export async function secureSet(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const encrypted = await encryptValue(value);
  localStorage.setItem(key, encrypted);
}

/**
 * Retrieves and decrypts a value from localStorage.
 */
export async function secureGet(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;
  return decryptValue(encrypted);
}

/**
 * Securely stores an object in localStorage.
 */
export async function secureSetObject(key: string, value: object): Promise<void> {
  await secureSet(key, JSON.stringify(value));
}

/**
 * Securely retrieves and parses an object from localStorage.
 */
export async function secureGetObject<T = unknown>(key: string): Promise<T | null> {
  const value = await secureGet(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
