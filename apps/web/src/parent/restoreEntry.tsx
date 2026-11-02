import { restoreBackup } from '../db/backup';
import { db } from '../db/db';
import { Restore } from './Restore';

/** For a new phone: the file arrives before any child exists, so there's no PIN to pass yet. */
export default function SetupRestore({ onRestored }: { onRestored: () => void }) {
  return (
    <main className="parent">
      <div className="parent-page">
        <Restore restore={(backup) => restoreBackup(db, backup)} onRestored={onRestored} />
      </div>
    </main>
  );
}
