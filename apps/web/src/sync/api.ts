import type {
  AccountInfo,
  HealthResponse,
  KeyEnvelope,
  PullResponse,
  PushResponse,
  PutKeyRequest,
  RecapRequest,
  VerifyResponse,
  WireRecord,
} from '@mathapp/worker/protocol';

/** The sync server, as the app sees it. Tests swap in the real Worker running in-process. */
export interface SyncApi {
  health(): Promise<HealthResponse>;
  sendCode(email: string): Promise<void>;
  verify(email: string, code: string): Promise<VerifyResponse>;
  account(token: string): Promise<AccountInfo>;
  getKey(token: string): Promise<KeyEnvelope | undefined>;
  putKey(token: string, request: PutKeyRequest): Promise<void>;
  pull(token: string, since: number): Promise<PullResponse>;
  push(token: string, records: WireRecord[]): Promise<PushResponse>;
  recap(token: string, request: RecapRequest): Promise<void>;
  signOut(token: string, all: boolean): Promise<void>;
  deleteAccount(token: string): Promise<void>;
}

/** A refusal from the server, with words a grown-up can act on. */
export class SyncError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const OFFLINE = "Can't reach the sync server. Check the connection and try again.";

export function httpApi(base: string, send: typeof fetch = (...a) => fetch(...a)): SyncApi {
  async function call<T>(
    method: string,
    path: string,
    options: { token?: string; body?: unknown } = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await send(`${base}${path}`, {
        method,
        headers: {
          ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
          ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
    } catch {
      throw new SyncError(0, OFFLINE);
    }
    if (response.status === 204) return undefined as T;
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new SyncError(response.status || 0, OFFLINE);
    }
    if (!response.ok) {
      const message = (data as { error?: string }).error ?? OFFLINE;
      throw new SyncError(response.status, message);
    }
    return data as T;
  }

  return {
    health: () => call('GET', '/api/health'),
    sendCode: (email) => call('POST', '/api/auth/start', { body: { email } }),
    verify: (email, code) => call('POST', '/api/auth/verify', { body: { email, code } }),
    account: (token) => call('GET', '/api/account', { token }),
    async getKey(token) {
      try {
        return await call<KeyEnvelope>('GET', '/api/key', { token });
      } catch (error) {
        if (error instanceof SyncError && error.status === 404) return undefined;
        throw error;
      }
    },
    putKey: (token, body) => call('PUT', '/api/key', { token, body }),
    pull: (token, since) => call('GET', `/api/sync?since=${since}`, { token }),
    push: (token, records) => call('POST', '/api/sync', { token, body: { records } }),
    recap: (token, body) => call('PUT', '/api/recap', { token, body }),
    signOut: (token, all) => call('POST', '/api/auth/signout', { token, body: { all } }),
    deleteAccount: (token) => call('DELETE', '/api/account', { token }),
  };
}
