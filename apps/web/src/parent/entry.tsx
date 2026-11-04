import { useMemo } from 'react';
import { createBackup, restoreBackup } from '../db/backup';
import { db } from '../db/db';
import { familyRepository } from '../db/repositories/family';
import { parentRepository } from '../db/repositories/parent';
import { sync } from '../sync/instance';
import { ParentApp } from './ParentApp';
import { PinGate } from './PinGate';

export default function Parent({ onExit }: { onExit: () => void }) {
  const services = useMemo(
    () => ({
      repo: parentRepository(db),
      family: familyRepository(db),
      createBackup: () => createBackup(db, Date.now()),
      restoreBackup: async (backup: Parameters<typeof restoreBackup>[1]) => {
        await restoreBackup(db, backup);
        await sync.afterRestore();
      },
      now: Date.now,
      sync,
    }),
    [],
  );
  return (
    <PinGate family={services.family} onExit={onExit}>
      <ParentApp services={services} onExit={onExit} />
    </PinGate>
  );
}
