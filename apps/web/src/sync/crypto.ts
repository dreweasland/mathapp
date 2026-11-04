import type { KeyEnvelope } from '@mathapp/worker/protocol';

/**
 * End-to-end encryption for sync. A random family key encrypts every row on the device; the
 * server stores only ciphertext and an id it can't read anything from. The family key itself
 * goes to the server wrapped with the grown-up's sync passphrase, so a new device can open it
 * and the server can't.
 */
export const PBKDF2_ITERATIONS = 600_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toBase64(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let text = '';
  for (let i = 0; i < view.length; i += 0x8000) {
    text += String.fromCharCode(...view.subarray(i, i + 0x8000));
  }
  return btoa(text);
}

export function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const decoded = atob(text);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes;
}

const base64url = (bytes: ArrayBuffer) =>
  toBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

const random = (size: number) => crypto.getRandomValues(new Uint8Array(size));

/** The same passphrase typed on any keyboard gives the same key. */
const normalPassphrase = (text: string) => encoder.encode(text.normalize('NFKC').trim());

async function passphraseKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
) {
  const base = await crypto.subtle.importKey('raw', normalPassphrase(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** A new family key: 32 random bytes. */
export const newFamilyKey = (): Uint8Array<ArrayBuffer> => random(32);

export async function wrapFamilyKey(
  familyKey: Uint8Array<ArrayBuffer>,
  passphrase: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<KeyEnvelope> {
  const salt = random(16);
  const iv = random(12);
  const key = await passphraseKey(passphrase, salt, iterations);
  const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, familyKey);
  return { salt: toBase64(salt), iterations, iv: toBase64(iv), wrapped: toBase64(wrapped) };
}

/** Undefined when the passphrase is wrong. */
export async function unwrapFamilyKey(
  envelope: KeyEnvelope,
  passphrase: string,
): Promise<Uint8Array<ArrayBuffer> | undefined> {
  const key = await passphraseKey(passphrase, fromBase64(envelope.salt), envelope.iterations);
  try {
    const raw = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv) },
      key,
      fromBase64(envelope.wrapped),
    );
    return new Uint8Array(raw);
  } catch {
    return undefined;
  }
}

export interface RowKeys {
  /** Encrypts and decrypts rows. */
  rows: CryptoKey;
  /** Turns a table and key into a record id the server can't reverse. */
  ids: CryptoKey;
}

/** Two keys from the family key, each for one job. */
export async function rowKeys(familyKey: Uint8Array<ArrayBuffer>): Promise<RowKeys> {
  const base = await crypto.subtle.importKey('raw', familyKey, 'HKDF', false, ['deriveKey']);
  const derive = (
    info: string,
    algorithm: AesKeyGenParams | HmacKeyGenParams,
    usages: KeyUsage[],
  ) =>
    crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: encoder.encode(info) },
      base,
      algorithm,
      false,
      usages,
    );
  return {
    rows: await derive('mathapp sync rows', { name: 'AES-GCM', length: 256 }, [
      'encrypt',
      'decrypt',
    ]),
    ids: await derive('mathapp sync ids', { name: 'HMAC', hash: 'SHA-256', length: 256 }, ['sign']),
  };
}

export async function recordId(keys: RowKeys, table: string, key: string): Promise<string> {
  return base64url(await crypto.subtle.sign('HMAC', keys.ids, encoder.encode(`${table}\n${key}`)));
}

/** JSON that keeps recordings: bytes become `{ $bytes: base64 }`. */
const replacer = (_key: string, value: unknown) =>
  value instanceof ArrayBuffer
    ? { $bytes: toBase64(value) }
    : ArrayBuffer.isView(value)
      ? { $bytes: toBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)) }
      : value;

const reviver = (_key: string, value: unknown) =>
  value && typeof value === 'object' && typeof (value as { $bytes?: unknown }).$bytes === 'string'
    ? fromBase64((value as { $bytes: string }).$bytes).buffer
    : value;

/** The record id is bound in, so the server can't swap one row's ciphertext for another's. */
export async function seal(keys: RowKeys, id: string, payload: unknown): Promise<string> {
  const iv = random(12);
  const plain = encoder.encode(JSON.stringify(payload, replacer));
  const sealed = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(id) },
    keys.rows,
    plain,
  );
  const out = new Uint8Array(12 + sealed.byteLength);
  out.set(iv);
  out.set(new Uint8Array(sealed), 12);
  return toBase64(out);
}

/** Throws if the data was changed or sealed with another key. */
export async function open(keys: RowKeys, id: string, data: string): Promise<unknown> {
  const bytes = fromBase64(data);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.subarray(0, 12), additionalData: encoder.encode(id) },
    keys.rows,
    bytes.subarray(12),
  );
  return JSON.parse(decoder.decode(plain), reviver);
}
