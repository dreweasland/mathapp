import { restoreBackup } from '../db/backup';
import { db } from '../db/db';
import { sync } from '../sync/instance';
import { Restore } from './Restore';
import { SyncPanel } from './SyncPanel';

/**
 * For a new phone: progress arrives, by sync or a file, before any child exists, so there's
 * no PIN to pass yet. Signing in still needs the code from the grown-up's email.
 */
export default function SetupRestore({
  onRestored,
  onBack,
}: {
  onRestored: () => void;
  onBack: () => void;
}) {
  return (
    <main className="parent">
      <div className="parent-page">
        <button type="button" className="p-btn self-start" onClick={onBack}>
          ‹ Back to setup
        </button>
        <SyncPanel sync={sync} now={Date.now} onChanged={onRestored} />
        <Restore
          restore={async (backup) => {
            await restoreBackup(db, backup);
            await sync.afterRestore();
          }}
          onRestored={onRestored}
        />
      </div>
    </main>
  );
}
