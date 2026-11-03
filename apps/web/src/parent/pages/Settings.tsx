import type { ChildSettings } from '@mathapp/engine';
import { useEffect, useState } from 'react';
import { APP_NAME } from '../../config';
import type { PageProps } from '../ParentApp';
import { reminderCalendar } from '../reminder';
import { saveFile } from '../saveFile';

const englishVoices = () =>
  typeof speechSynthesis === 'undefined'
    ? []
    : speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 h-6 w-6 shrink-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block font-bold">{label}</span>
        <span className="block text-sm">{hint}</span>
      </span>
    </label>
  );
}

export function Settings({ view, today, services, reload }: PageProps) {
  const { child } = view;
  const { settings } = child;
  const [voices, setVoices] = useState(englishVoices);
  const [time, setTime] = useState(settings.mathTime ?? '16:00');
  const [note, setNote] = useState('');

  // iOS loads voices late, so the list can start empty.
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return undefined;
    const refresh = () => setVoices(englishVoices());
    speechSynthesis.addEventListener?.('voiceschanged', refresh);
    return () => speechSynthesis.removeEventListener?.('voiceschanged', refresh);
  }, []);

  const change = async (changes: Partial<ChildSettings>) => {
    await services.repo.saveChild({ ...child, settings: { ...settings, ...changes } });
    await reload();
  };

  const tryVoice = (name: string | undefined) => {
    const line = new SpeechSynthesisUtterance("Hi! Let's do some math.");
    const voice = voices.find((v) => v.name === name);
    if (voice) line.voice = voice;
    line.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(line);
  };

  const addReminder = async () => {
    await change({ mathTime: time });
    const file = new File(
      [
        reminderCalendar({
          uid: `${child.id}-math-time`,
          name: child.name,
          appName: APP_NAME,
          time,
          from: today,
          at: services.now(),
        }),
      ],
      'math-time.ics',
      { type: 'text/calendar' },
    );
    if (await saveFile(file)) setNote('Open the file and add it to your calendar.');
  };

  return (
    <>
      <section className="p-card flex flex-col gap-3" data-testid="settings">
        <h2 className="font-extrabold">
          {child.avatar} {child.name}
        </h2>
        <div>
          <label className="font-bold">
            Voice
            <select
              className="p-input font-normal"
              value={settings.voice ?? ''}
              onChange={(e) => {
                const name = e.target.value;
                const next = { ...settings };
                delete next.voice;
                if (name) next.voice = name;
                void services.repo.saveChild({ ...child, settings: next }).then(() => reload());
                tryVoice(name || undefined);
              }}
            >
              <option value="">Device default</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Toggle
          label="Left-handed"
          hint="Puts the check mark on the left of the number pad."
          checked={settings.handedness === 'left'}
          onChange={(on) => void change({ handedness: on ? 'left' : 'right' })}
        />
        <Toggle
          label="Reduce motion"
          hint="Turns off bounces and confetti."
          checked={settings.reduceMotion}
          onChange={(reduceMotion) => void change({ reduceMotion })}
        />
        <Toggle
          label="Color-blind-safe colors"
          hint="Swaps the green and amber for blue and yellow."
          checked={settings.colorBlindSafe}
          onChange={(colorBlindSafe) => void change({ colorBlindSafe })}
        />
      </section>

      <section className="p-card flex flex-col gap-2" data-testid="math-time">
        <h2 className="font-extrabold">Math time</h2>
        <p className="text-sm">
          Picking a regular time helps the habit stick. This adds a daily alert to your own
          calendar, which you can change or delete there. The app can't send notifications itself
          without a server.
        </p>
        <label className="font-bold">
          When is math time?
          <input
            type="time"
            className="p-input font-normal"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="p-btn p-btn-main"
          disabled={time === ''}
          onClick={() => void addReminder()}
        >
          Add to calendar
        </button>
        {note && (
          <p role="status" className="text-sm font-bold">
            {note}
          </p>
        )}
      </section>
    </>
  );
}
