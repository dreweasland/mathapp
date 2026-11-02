import { GRADE_1_SKILLS } from '@mathapp/content';
import type { ChildProfile, DailyGoal } from '@mathapp/engine';
import { useState } from 'react';
import { AVATARS, DAILY_GOALS } from '../../screens/Setup';
import type { PageProps } from '../ParentApp';

function Avatars({
  value,
  taken,
  onPick,
}: {
  value: string;
  taken: string[];
  onPick: (avatar: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Picture">
      {AVATARS.map((a) => (
        <button
          key={a}
          type="button"
          aria-label={`picture ${a}`}
          aria-pressed={a === value}
          disabled={taken.includes(a)}
          className={`p-btn text-xl ${a === value ? 'p-btn-main' : ''}`}
          onClick={() => onPick(a)}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

function Edit({ view, services, reload, others }: PageProps & { others: ChildProfile[] }) {
  const { child } = view;
  const [name, setName] = useState(child.name);
  const [saved, setSaved] = useState(false);
  const update = async (changes: Partial<ChildProfile>) => {
    await services.repo.saveChild({ ...child, ...changes });
    await reload();
    setSaved(true);
  };
  return (
    <section className="p-card flex flex-col gap-2" data-testid="edit-child">
      <h2 className="font-extrabold">
        {child.avatar} {child.name}
      </h2>
      <label className="font-bold">
        Name
        <input
          className="p-input font-normal"
          value={name}
          maxLength={30}
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name.trim() !== child.name) void update({ name: name.trim() });
          }}
        />
      </label>
      <Avatars
        value={child.avatar}
        taken={others.map((c) => c.avatar)}
        onPick={(avatar) => void update({ avatar })}
      />
      <label className="font-bold">
        Daily goal
        <select
          className="p-input font-normal"
          value={child.dailyGoal}
          onChange={(e) => void update({ dailyGoal: e.target.value as DailyGoal })}
        >
          {DAILY_GOALS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm">Grade 1, animal theme. Grades 2 and 3 arrive with their content.</p>
      <StartAt {...{ view, services, reload }} today="" />
      {saved && (
        <p role="status" className="text-sm font-bold">
          Saved.
        </p>
      )}
    </section>
  );
}

/** The placement override from the brief. It only moves a child forward. */
function StartAt({ view, services, reload }: PageProps) {
  const [skillId, setSkillId] = useState('');
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="font-bold">
        Start further along
        <select
          className="p-input font-normal"
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
        >
          <option value="">Choose a skill</option>
          {GRADE_1_SKILLS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm">Everything this skill depends on will count as passed.</p>
      <button
        type="button"
        className="p-btn self-start"
        disabled={skillId === ''}
        onClick={() =>
          void services.repo
            .startAt(view.child, skillId)
            .then(() => reload())
            .then(() => setDone(true))
        }
      >
        Start here
      </button>
      {done && (
        <p role="status" className="text-sm font-bold">
          Done.
        </p>
      )}
    </div>
  );
}

function AddChild({ services, reload, taken }: PageProps & { taken: string[] }) {
  const free = AVATARS.filter((a) => !taken.includes(a));
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(free[0] ?? '');
  const [goal, setGoal] = useState<DailyGoal>('quest');
  if (free.length === 0) return null;
  const chosen = free.includes(avatar) ? avatar : (free[0] as string);
  return (
    <section className="p-card flex flex-col gap-2" data-testid="add-child">
      <h2 className="font-extrabold">Add a child</h2>
      <label className="font-bold">
        Name
        <input
          className="p-input font-normal"
          value={name}
          maxLength={30}
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <Avatars value={chosen} taken={taken} onPick={setAvatar} />
      <label className="font-bold">
        Daily goal
        <select
          className="p-input font-normal"
          value={goal}
          onChange={(e) => setGoal(e.target.value as DailyGoal)}
        >
          {DAILY_GOALS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="p-btn p-btn-main"
        disabled={name.trim() === ''}
        onClick={() =>
          void services.repo
            .addChild({ name: name.trim(), avatar: chosen, dailyGoal: goal })
            .then((child) => {
              setName('');
              return reload(child.id);
            })
        }
      >
        Add child
      </button>
    </section>
  );
}

/** Wipes real progress, so it asks for the child's name, not just a tap. */
function StartOver({ view, services, reload, single }: PageProps & { single: boolean }) {
  const { child } = view;
  const [typed, setTyped] = useState('');
  const match = typed.trim().toLowerCase() === child.name.toLowerCase();
  const act = (work: Promise<void>) =>
    void work.then(() => {
      setTyped('');
      return reload();
    });
  return (
    <section className="p-card flex flex-col gap-2" data-testid="start-over">
      <h2 className="font-extrabold">Start over</h2>
      <p className="text-sm">
        This erases all of {child.name}'s progress, coins, animals and badges from this device, and
        it can't be undone. Save a backup first. To go ahead, type {child.name}'s name.
      </p>
      <input
        aria-label="Type the child's name"
        className="p-input"
        value={typed}
        autoComplete="off"
        onChange={(e) => setTyped(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="p-btn"
          disabled={!match}
          onClick={() => act(services.repo.resetChild(child))}
        >
          Erase progress
        </button>
        {!single && (
          <button
            type="button"
            className="p-btn"
            disabled={!match}
            onClick={() => act(services.repo.removeChild(child.id))}
          >
            Remove {child.name}
          </button>
        )}
      </div>
    </section>
  );
}

export function Children({ everyone, ...props }: PageProps & { everyone: ChildProfile[] }) {
  const { child } = props.view;
  const others = everyone.filter((c) => c.id !== child.id);
  return (
    <>
      <Edit key={child.id} {...props} others={others} />
      <AddChild {...props} taken={everyone.map((c) => c.avatar)} />
      <StartOver key={`over-${child.id}`} {...props} single={everyone.length === 1} />
    </>
  );
}
