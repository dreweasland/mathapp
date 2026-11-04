import { LIMITS } from '@mathapp/worker/protocol';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Sync, SyncResult, SyncStatus } from '../sync/client';

type Step =
  | { kind: 'loading' }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'email' }
  | { kind: 'code'; email: string }
  | SyncStatus;

const when = (at: number | undefined, now: number) => {
  if (at === undefined) return 'not yet';
  const minutes = Math.round((now - at) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return new Date(at).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

function Passphrase({
  label,
  confirm,
  busy,
  action,
  onSubmit,
}: {
  label: string;
  /** Asks twice, for a new passphrase. */
  confirm: boolean;
  busy: boolean;
  action: string;
  onSubmit: (passphrase: string) => void;
}) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const short = first.trim().length < LIMITS.passphraseMin;
  const mismatch = confirm && second !== '' && second !== first;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!short && (!confirm || first === second)) onSubmit(first);
  };
  return (
    <form className="flex flex-col gap-2" onSubmit={submit}>
      <label className="font-bold">
        {label}
        <input
          type="password"
          className="p-input font-normal"
          autoComplete={confirm ? 'new-password' : 'current-password'}
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        />
      </label>
      {confirm && (
        <label className="font-bold">
          Type it again
          <input
            type="password"
            className="p-input font-normal"
            autoComplete="new-password"
            value={second}
            onChange={(e) => setSecond(e.target.value)}
          />
        </label>
      )}
      <p className="text-sm">
        At least {LIMITS.passphraseMin} characters. A few words you'll remember works well.
        {mismatch && <strong> The two don't match yet.</strong>}
      </p>
      <button
        type="submit"
        className="p-btn p-btn-main"
        disabled={busy || short || (confirm && first !== second)}
      >
        {busy ? 'Working…' : action}
      </button>
    </form>
  );
}

/**
 * Turning on cloud sync: email code, then the family's passphrase, then status and controls.
 * Used in the dashboard and on a new device's setup, where there's no PIN to pass yet.
 */
export function SyncPanel({
  sync,
  now,
  onChanged,
}: {
  sync: Sync;
  now: () => number;
  /** Rows on this device changed, so whatever shows them should read again. */
  onChanged: () => void | Promise<void>;
}) {
  const [step, setStep] = useState<Step>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [note, setNote] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [forgot, setForgot] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = async () => {
    const status = await sync.status();
    if (status.kind !== 'off') {
      setStep(status);
      return;
    }
    try {
      setStep(
        (await sync.available())
          ? { kind: 'email' }
          : { kind: 'unavailable', reason: "Cloud sync isn't set up on this server yet." },
      );
    } catch (error) {
      setStep({ kind: 'unavailable', reason: message(error) });
    }
  };

  useEffect(() => {
    void refresh();
    // Only on opening; each action refreshes after itself.
  }, []);

  /** Runs one action with a busy state, showing its error in words. */
  async function act(run: () => Promise<void>) {
    setBusy(true);
    setProblem('');
    setNote('');
    try {
      await run();
    } catch (error) {
      setProblem(message(error));
    } finally {
      setBusy(false);
    }
  }

  const finish = async (result: SyncResult | false) => {
    if (result === false) {
      setProblem("That passphrase doesn't open this family's progress. Check it and try again.");
      return;
    }
    if (result.error) setProblem(result.error);
    else setNote('Synced.');
    if (result.changed) await onChanged();
    setForgot(false);
    await refresh();
  };

  let body: ReactNode = null;
  switch (step.kind) {
    case 'loading':
      body = <p>Checking…</p>;
      break;

    case 'unavailable':
      body = (
        <>
          <p>{step.reason}</p>
          <button type="button" className="p-btn" onClick={() => void act(refresh)}>
            Try again
          </button>
        </>
      );
      break;

    case 'email':
      body = (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void act(async () => {
              await sync.sendCode(email.trim());
              setCode('');
              setStep({ kind: 'code', email: email.trim() });
            });
          }}
        >
          <p className="text-sm">
            Keeps progress the same on every device you sign in on, and can email you a short recap
            each Sunday. Progress is locked with a passphrase on this device before it's sent, so
            the server can't read it.
          </p>
          <label className="font-bold">
            Your email
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className="p-input font-normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="p-btn p-btn-main"
            disabled={busy || !email.includes('@')}
          >
            {busy ? 'Sending…' : 'Email me a code'}
          </button>
        </form>
      );
      break;

    case 'code':
      body = (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void act(async () => {
              await sync.verify(step.email, code);
              await refresh();
            });
          }}
        >
          <p className="text-sm">
            We sent a 6-digit code to {step.email}. It works for 10 minutes.
          </p>
          <label className="font-bold">
            Code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={7}
              className="p-input font-normal tracking-widest"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="p-btn p-btn-main"
            disabled={busy || code.replace(/\D/g, '').length !== 6}
          >
            Sign in
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="p-link"
              onClick={() => void act(() => sync.sendCode(step.email).then(() => setNote('Sent.')))}
            >
              Send a new code
            </button>
            <button type="button" className="p-link" onClick={() => setStep({ kind: 'email' })}>
              Use a different email
            </button>
          </div>
        </form>
      );
      break;

    case 'needs-key':
      body = !step.hasKey ? (
        <>
          <p className="text-sm">
            Signed in as {step.email}. Choose a sync passphrase. You'll type it once on each device.
            Write it down somewhere safe: nobody, including us, can recover it.
          </p>
          <Passphrase
            label="Sync passphrase"
            confirm
            busy={busy}
            action="Turn on sync"
            onSubmit={(p) => void act(async () => finish(await sync.createKey(p)))}
          />
        </>
      ) : forgot ? (
        <>
          <p className="text-sm font-bold">
            Starting over replaces the cloud copy with this device's progress, under a new
            passphrase. Other devices keep their own progress, and join again with the new
            passphrase; anything only they have stays on them.
          </p>
          <Passphrase
            label="New sync passphrase"
            confirm
            busy={busy}
            action="Start over from this device"
            onSubmit={(p) => void act(async () => finish(await sync.replaceKey(p)))}
          />
          <button type="button" className="p-link" onClick={() => setForgot(false)}>
            I remember it
          </button>
        </>
      ) : (
        <>
          <p className="text-sm">
            Signed in as {step.email}. Type the sync passphrase you chose on your first device.
            Progress on both devices is combined, and nothing earned is lost.
          </p>
          <Passphrase
            label="Sync passphrase"
            confirm={false}
            busy={busy}
            action="Unlock and sync"
            onSubmit={(p) => void act(async () => finish(await sync.openKey(p)))}
          />
          <button type="button" className="p-link" onClick={() => setForgot(true)}>
            Forgot the passphrase?
          </button>
        </>
      );
      break;

    case 'on':
      body = (
        <>
          <p data-testid="sync-status">
            Syncing as <strong>{step.email}</strong>. Last synced {when(step.lastSyncedAt, now())}.
          </p>
          <button
            type="button"
            className="p-btn p-btn-main"
            disabled={busy}
            onClick={() => void act(async () => finish(await sync.run()))}
          >
            {busy ? 'Syncing…' : 'Sync now'}
          </button>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-6 w-6 shrink-0"
              checked={step.recap}
              disabled={busy}
              onChange={(e) => {
                const on = e.target.checked;
                void act(async () => {
                  await sync.setRecap(on);
                  await refresh();
                });
              }}
            />
            <span>
              <span className="block font-bold">Weekly email</span>
              <span className="block text-sm">
                Sunday evening: each child's quests, minutes, problems, first-try accuracy, streak
                and new badges. To send it, those numbers and first names are stored readable on the
                server; turning this off deletes them.
              </span>
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="p-btn"
              disabled={busy}
              onClick={() => void act(async () => (await sync.signOut(false), refresh()))}
            >
              Sign out of this device
            </button>
            <button
              type="button"
              className="p-btn"
              disabled={busy}
              onClick={() => void act(async () => (await sync.signOut(true), refresh()))}
            >
              Sign out everywhere
            </button>
          </div>
          {confirmDelete ? (
            <div className="flex flex-col gap-2" data-testid="delete-cloud-confirm">
              <p className="font-bold">
                This deletes the family's cloud copy and account. Every device keeps the progress it
                has now, and stops syncing.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-btn p-btn-main"
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      await sync.deleteCloud();
                      setConfirmDelete(false);
                      await refresh();
                      setNote('The cloud copy is deleted.');
                    })
                  }
                >
                  Delete the cloud copy
                </button>
                <button type="button" className="p-btn" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="p-link self-start"
              onClick={() => setConfirmDelete(true)}
            >
              Delete the cloud copy…
            </button>
          )}
        </>
      );
      break;
  }

  return (
    <section className="p-card flex flex-col gap-2 text-left" data-testid="sync">
      <h2 className="font-extrabold">Cloud sync</h2>
      {body}
      {problem && (
        <p role="alert" className="font-bold">
          {problem}
        </p>
      )}
      {note && (
        <p role="status" className="font-bold">
          {note}
        </p>
      )}
    </section>
  );
}
