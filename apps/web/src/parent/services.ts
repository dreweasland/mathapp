import type { Backup } from '../db/backup';
import type { FamilyRepository } from '../db/repositories/family';
import type { ParentRepository } from '../db/repositories/parent';

/** Passed in, so component tests can run the dashboard on a throwaway database. */
export interface ParentServices {
  repo: ParentRepository;
  family: FamilyRepository;
  createBackup: () => Promise<Backup>;
  restoreBackup: (backup: Backup) => Promise<void>;
  now: () => number;
}
