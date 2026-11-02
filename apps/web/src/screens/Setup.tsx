import type { ChildProfile, DailyGoal } from '@mathapp/engine';
import { useState, type ReactNode } from 'react';
import { APP_NAME } from '../config';
import { Mascot } from '../ui/Mascot';

export const AVATARS = ['🐻', '🦊', '🐰', '🐼', '🐯', '🐸'];

/** Picked together. The challenge stays optional and the streak ignores it either way. */
export const DAILY_GOALS: { value: DailyGoal; label: string }[] = [
  { value: 'quest', label: 'Just the quest' },
  { value: 'quest+challenge', label: 'Quest + challenge' },
];

function isIos() {
  const touchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || touchMac;
}

function isInstalled() {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return standalone === true || matchMedia('(display-mode: standalone)').matches;
}

/** Safari tabs and the installed app keep separate data, so install has to come first. */
export const needsInstall = () => isIos() && !isInstalled();

function InstallSteps({ onSkip }: { onSkip: () => void }) {
  return (
    <main className="screen items-center justify-center-safe overflow-y-auto text-center">
      <Mascot />
      <h1 className="text-3xl font-extrabold">Grown-ups: install first</h1>
      <p className="max-w-sm text-lg">
        Progress saved in a Safari tab can be erased, and it won't carry over to the installed app.
      </p>
      <ol className="max-w-sm list-decimal pl-6 text-left text-lg">
        <li>
          Tap the <strong>Share</strong> button in Safari.
        </li>
        <li>
          Choose <strong>Add to Home Screen</strong>.
        </li>
        <li>Open {APP_NAME} from the new icon on your Home Screen.</li>
      </ol>
      <button type="button" className="tap min-h-16 px-6 text-lg" onClick={onSkip}>
        Continue in Safari for now
      </button>
    </main>
  );
}

/** Done by a grown-up, once, so plain text and the keyboard are fine here. */
export function Setup({
  onDone,
  restore,
}: {
  onDone: (
    name: string,
    avatar: string,
    dailyGoal: DailyGoal,
    grade: ChildProfile['grade'],
  ) => void;
  /** Loaded only if asked for, since most setups have nothing to bring. */
  restore: ReactNode;
}) {
  const [skipped, setSkipped] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0] as string);
  const [goal, setGoal] = useState<DailyGoal>('quest');
  const [restoring, setRestoring] = useState(false);
  const [grade, setGrade] = useState<ChildProfile['grade']>(1);
  if (needsInstall() && !skipped) return <InstallSteps onSkip={() => setSkipped(true)} />;
  if (restoring) return restore;
  return (
    <main className="screen items-center justify-center-safe overflow-y-auto text-center select-text">
      <h1 className="text-4xl font-extrabold">{APP_NAME}</h1>
      <label className="flex w-full max-w-sm flex-col gap-1 text-lg font-bold">
        Child's name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-16 rounded-2xl border-4 border-ink bg-white px-4 text-2xl"
          autoComplete="off"
        />
      </label>
      <div className="grid grid-cols-3 gap-3" role="group" aria-label="avatar">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            aria-label={`avatar ${a}`}
            aria-pressed={a === avatar}
            onClick={() => setAvatar(a)}
            className={`tap min-h-20 text-5xl ${a === avatar ? 'tap-primary' : ''}`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="grid w-full max-w-sm grid-cols-3 gap-3" role="group" aria-label="grade">
        {([1, 2, 3] as const).map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={grade === g}
            onClick={() => setGrade(g)}
            className={`tap min-h-16 px-2 text-lg font-bold ${grade === g ? 'tap-primary' : ''}`}
          >
            Grade {g}
          </button>
        ))}
      </div>
      <div className="grid w-full max-w-sm grid-cols-2 gap-3" role="group" aria-label="daily goal">
        {DAILY_GOALS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={goal === value}
            onClick={() => setGoal(value)}
            className={`tap min-h-16 px-2 text-lg font-bold ${goal === value ? 'tap-primary' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="done"
        disabled={name.trim() === ''}
        onClick={() => onDone(name.trim(), avatar, goal, grade)}
        className="tap tap-primary min-h-20 w-full max-w-sm text-4xl font-extrabold"
      >
        ✓
      </button>
      <button type="button" className="p-link" onClick={() => setRestoring(true)}>
        Moving from another device? Restore a backup
      </button>
    </main>
  );
}
