import { useEffect, useState } from 'react';
import { shortDate } from '../labels';
import type { PageProps } from '../ParentApp';
import { Restore } from '../Restore';
import { saveFile } from '../saveFile';

export function Data({ today, services, reload }: PageProps) {
  const [lastBackup, setLastBackup] = useState<number>();
  const [saved, setSaved] = useState(false);

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

  return (
    <>
      <section className="p-card flex flex-col gap-2" data-testid="backup">
        <h2 className="font-extrabold">Save a backup</h2>
        <p className="text-sm">
          Without cloud sync, all progress lives only on this device. A backup is one file with
          every child's progress, and it stays private unless you share it. Your PIN isn't in it.
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

      <Restore restore={services.restoreBackup} onRestored={() => reload()} />
    </>
  );
}
