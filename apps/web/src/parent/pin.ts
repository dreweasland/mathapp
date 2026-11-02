export const PIN_LENGTH = 4;

const hex = (bytes: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(bytes instanceof ArrayBuffer ? bytes : bytes.buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const newSalt = (): string => hex(crypto.getRandomValues(new Uint8Array(16)));

/**
 * A gate for a 6-year-old, not a vault: four digits can't stand up to anyone with the device.
 * The hash just avoids leaving a parent's usual PIN readable in storage.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return hex(await crypto.subtle.digest('SHA-256', data));
}

/** Answering proves a grown-up is here, for setting a PIN or replacing a forgotten one. */
export function grownUpQuestion(random = Math.random): { text: string; answer: string } {
  const a = 12 + Math.floor(random() * 8);
  const b = 6 + Math.floor(random() * 4);
  return { text: `${a} × ${b}`, answer: String(a * b) };
}
