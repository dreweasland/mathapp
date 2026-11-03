import { useMemo } from 'react';
import { createBackup, restoreBackup } from '../db/backup';
import { db } from '../db/db';
import { familyRepository } from '../db/repositories/family';
import { parentRepository } from '../db/repositories/parent';
import { ParentApp } from './ParentApp';
import { PinGate } from './PinGate';

export default function Parent({ onExit }: { onExit: () => void }) {
  const services = useMemo(
    () => ({
      repo: parentRepository(db),
      family: familyRepository(db),
      createBackup: () => createBackup(db, Date.now()),
      restoreBackup: (backup: Parameters<typeof restoreBackup>[1]) => restoreBackup(db, backup),
      now: Date.now,
    }),
    [],
  );
  return (
    <PinGate family={services.family} onExit={onExit}>
      <ParentApp services={services} onExit={onExit} />
    </PinGate>
  );
}
