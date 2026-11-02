import { useEffect, useState, type ChangeEvent } from 'react';
import { parseBackup, type ParsedBackup } from '../../db/backup';
import { shortDate } from '../labels';
import type { PageProps } from '../ParentApp';
import { saveFile } from '../saveFile';

/** Bigger than years of practice with recordings, so a wrong file can't hang the app. */
const MAX_FILE_BYTES = 100 * 1024 * 1024;

type Ready = Extract<ParsedBackup, { ok: true }>;

export function Data({ today, services, reload }: PageProps) {
  const [lastBackup, setLastBackup] = useState<number>();
  const [saved, setSaved] = useState(false);
  const [problem, setProblem] = useState('');
  const [picked, setPicked] = useState<Ready>();
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    void services.family.get().then((f) => setLastBackup(f.lastBackupAt));
  }, [services, saved]);

  const save = async () => {
    setSaved(false);
    const backup = await services.createBackup();
    const file = new File([JSON.stringify(backup)], `math-quest-backup-${today}.json`, {
      type: 'application/json',
    });
    if (await saveFile(file)) {
      await services.family.markBackedUp();
      setSaved(true);
    }
  };

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPicked(undefined);
    setProblem('');
    setRestored(false);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setProblem('This file is too big to be a backup.');
      return;
    }
    const parsed = parseBackup(await file.text());
    if (parsed.ok) setPicked(parsed);
    else setProblem(parsed.reason);
  };

  const restore = async () => {
    if (!picked) return;
    try {
      await services.restoreBackup(picked.backup);
      setPicked(undefined);
      setRestored(true);
      await reload();
    } catch (error) {
      console.error(error);
      setProblem("The restore didn't finish, so nothing on this device changed.");
    }
  };

  return (
    <>
      <section className="p-card flex flex-col gap-2" data-testid="backup">
        <h2 className="font-extrabold">Save a backup</h2>
        <p className="text-sm">
          All progress lives only on this device. A backup is one file with every child's progress,
          and it stays private unless you share it. Your PIN isn't in it.
        </p>
        <p className="text-sm">
          {lastBackup === undefined
            ? 'No backup saved yet.'
            : `Last saved ${shortDate(lastBackup)}.`}
        </p>
        <button type="button" className="p-btn p-btn-main" onClick={() => void save()}>
          Save backup
        </button>
        {saved && (
          <p role="status" className="text-sm font-bold">
            Backup saved.
          </p>
        )}
      </section>

      <section className="p-card flex flex-col gap-2" data-testid="restore">
        <h2 className="font-extrabold">Restore a backup</h2>
        <p className="text-sm">Use this to move to a new device, or to recover progress.</p>
        <label className="font-bold">
          Choose a backup file
          <input
            type="file"
            className="p-input font-normal"
            accept=".json,application/json"
            onChange={(e) => void pick(e)}
          />
        </label>
        {problem && (
          <p role="alert" className="font-bold">
            {problem}
          </p>
        )}
        {picked && (
          <div className="flex flex-col gap-2" data-testid="restore-confirm">
            <p>
              Saved {shortDate(picked.summary.exportedAt)}:{' '}
              {picked.summary.children
                .map((c) => `${c.avatar} ${c.name} (${c.quests} quests)`)
                .join(', ')}
            </p>
            <p className="font-bold">
              This replaces everything on this device, for every child. Anything newer here will be
              gone.
            </p>
            <div className="flex gap-2">
              <button type="button" className="p-btn p-btn-main" onClick={() => void restore()}>
                Replace and restore
              </button>
              <button type="button" className="p-btn" onClick={() => setPicked(undefined)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {restored && (
          <p role="status" className="font-bold">
            Restored.
          </p>
        )}
      </section>
    </>
  );
}
