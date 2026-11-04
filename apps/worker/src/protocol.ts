/**
 * What the app and the sync Worker send each other. Everything under /api/ is JSON.
 *
 * The server never sees a child's progress: each row is encrypted on the device, keyed by an
 * id the device derives, and stored as opaque text. Only the weekly recap, which a grown-up
 * turns on, is readable, and it holds a few numbers per child.
 */

/** One encrypted row. `data` is base64 ciphertext, or null when the row was deleted. */
export interface WireRecord {
  id: string;
  updatedAt: number;
  data: string | null;
}

export interface PulledRecord extends WireRecord {
  /** Server order: pull again from the highest seq seen. */
  seq: number;
}

/** GET /api/sync?since=seq */
export interface PullResponse {
  records: PulledRecord[];
  next: number;
  more: boolean;
}

/** POST /api/sync */
export interface PushRequest {
  records: WireRecord[];
}

export interface PushResponse {
  stored: number;
  /** Rows the server already had a later copy of: merge them and push again. */
  newer: PulledRecord[];
}

/** The family key, wrapped with the grown-up's sync passphrase. The server can't open it. */
export interface KeyEnvelope {
  salt: string;
  iterations: number;
  iv: string;
  wrapped: string;
}

/** PUT /api/key. `replace` starts the cloud copy over, deleting every stored row. */
export interface PutKeyRequest {
  envelope: KeyEnvelope;
  replace?: boolean;
}

export interface StartRequest {
  email: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface AccountInfo {
  email: string;
  hasKey: boolean;
  recap: boolean;
}

export interface VerifyResponse extends AccountInfo {
  token: string;
}

export interface SignOutRequest {
  /** Every device, not just this one. */
  all?: boolean;
}

export interface RecapChild {
  name: string;
  quests: number;
  minutes: number;
  problems: number;
  /** First-try accuracy, 0–1, or null with no answers this week. */
  accuracy: number | null;
  streak: number;
  best: number;
  /** Badge names earned this week. */
  badges: string[];
}

/** PUT /api/recap. Turning it off deletes the stored summary. */
export interface RecapRequest {
  enabled: boolean;
  /** IANA name, so the email goes out on Sunday evening where the family is. */
  timeZone?: string;
  /** Monday of the week the numbers cover. */
  week?: string;
  children?: RecapChild[];
}

export interface HealthResponse {
  ok: true;
  /** Sign-in codes can be sent. Without email the sync screen says it isn't set up. */
  email: boolean;
}

export interface ErrorResponse {
  error: string;
}

/** Limits, shared so the app batches to fit. */
export const LIMITS = {
  pushRecords: 90,
  pullRecords: 200,
  /** Base64 characters in one row: a 20-second recording fits with room to spare. */
  recordChars: 1_500_000,
  codeMinutes: 10,
  codeTries: 5,
  codesPerHour: 5,
  passphraseMin: 8,
} as const;
