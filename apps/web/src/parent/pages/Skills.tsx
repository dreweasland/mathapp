import { ALL_SKILLS } from '@mathapp/content';
import { activeGrade, skillRows, skillSummary } from '@mathapp/engine';
import { ERROR_LABEL, TREND_LABEL, shortDate, statusLabel } from '../labels';
import type { PageProps } from '../ParentApp';

export function Skills({ view }: PageProps) {
  const { states } = view.progress;
  const grade = activeGrade(ALL_SKILLS, states);
  const shown = ALL_SKILLS.filter((s) => s.grade <= grade).reverse();
  const rows = skillRows(shown, states, view.attempts, ALL_SKILLS);
  const { mastered, needsHelp } = skillSummary(rows, ALL_SKILLS, states);
  return (
    <>
      <p>
        {mastered} of {rows.length} skills mastered.
        {needsHelp.length > 0 &&
          ` Could use extra help: ${needsHelp
            .slice(0, 3)
            .map((r) => r.skill.name)
            .join(', ')}.`}
      </p>
      <ul className="flex flex-col gap-2" data-testid="skill-list">
        {rows.map((row) => (
          <li key={row.skill.id} className="p-card" data-skill={row.skill.id}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-extrabold">{row.skill.name}</h2>
              <span className="text-sm whitespace-nowrap">{row.skill.standard}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink"
                role="img"
                aria-label={`mastery ${row.mastery}%`}
              >
                <span className="block h-full bg-ink" style={{ width: `${row.mastery}%` }} />
              </span>
              <span className="w-10 text-right font-bold">
                {row.attempts > 0 ? `${row.mastery}%` : '—'}
              </span>
              <span className="w-5 text-center font-extrabold" data-testid="trend">
                {row.trend ? (
                  <span aria-label={TREND_LABEL[row.trend].text}>
                    {TREND_LABEL[row.trend].arrow}
                  </span>
                ) : (
                  ''
                )}
              </span>
            </div>
            <p className="text-sm">
              {statusLabel(row.status, row.attempts)}
              {row.lastPracticedAt !== undefined && ` · last ${shortDate(row.lastPracticedAt)}`}
              {row.topError && ` · usual mistake: ${ERROR_LABEL[row.topError].toLowerCase()}`}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-sm">
        Trend compares the latest first-try answers with the ones before. Harder problems can lower
        it while a child improves, so treat it as a reason to look.
      </p>
    </>
  );
}
