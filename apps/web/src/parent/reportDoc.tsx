import { GRADE_1_SKILLS } from '@mathapp/content';
import {
  activityBetween,
  addDays,
  dailyActivity,
  factGrid,
  skillRows,
  skillSummary,
  type DayActivity,
  type SkillRow,
} from '@mathapp/engine';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Dashboard } from '../db/repositories/parent';
import { APP_NAME } from '../config';
import { FactTable, HeatLegend } from './FactTable';
import { ERROR_LABEL, STATUS_LABEL, TREND_LABEL, percent, shortDate } from './labels';

export const REPORT_DAYS = 30;

/** No outside files: this has to print, and open from a shared file, with no connection. */
const CSS = `
  @page { size: auto; margin: 0.5in; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html { background: #fff; }
  body {
    margin: 0 auto; max-width: 7.27in; padding: 0; color: #1d3557; background: #fff;
    font: 11px/1.3 ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif;
  }
  h1 { font-size: 21px; margin: 0; line-height: 1.15; }
  h2 { font-size: 12.5px; margin: 0 0 4px; border-bottom: 2px solid #1d3557; padding-bottom: 1px; }
  section { margin-top: 11px; }
  .top { display: flex; justify-content: space-between; align-items: end; gap: 12px; }
  .top p { margin: 0; text-align: right; }
  .stats { display: flex; gap: 6px; margin-top: 8px; }
  .stat { flex: 1; border: 1px solid #8fa3b5; border-radius: 6px; padding: 4px 6px; }
  .stat b { display: block; font-size: 17px; line-height: 1.15; }
  .notes { margin: 8px 0 0; padding-left: 15px; }
  .notes li { margin-bottom: 1px; }
  table.skills { width: 100%; border-collapse: collapse; }
  .skills th { text-align: left; font-size: 10px; padding: 1px 4px; border-bottom: 1px solid #1d3557; }
  .skills td { padding: 2.5px 4px; border-bottom: 1px solid #dde4ea; vertical-align: middle; }
  .bar { display: inline-block; width: 70px; height: 8px; border: 1px solid #1d3557; margin-right: 4px; vertical-align: -1px; }
  .bar i { display: block; height: 100%; background: #1d3557; }
  .facts { display: flex; gap: 14px; align-items: flex-start; }
  .facts > div > p { margin: 0 0 2px; font-weight: 700; }
  .legend { flex: 1; font-size: 10.5px; }
  .days { display: flex; align-items: flex-end; gap: 2px; height: 46px; border-bottom: 1px solid #1d3557; }
  .day { flex: 1; background: #cfe6f3; min-height: 0; }
  .day.quest { background: #1d3557; }
  .ticks { display: flex; gap: 2px; font-size: 9px; }
  .ticks span { flex: 1; white-space: nowrap; overflow: visible; height: 12px; }
  footer { margin-top: 9px; font-size: 9.5px; color: #44586c; }
`;

function SkillTable({ rows }: { rows: SkillRow[] }) {
  return (
    <table className="skills">
      <thead>
        <tr>
          <th>Skill</th>
          <th>Standard</th>
          <th>Mastery</th>
          <th>Status</th>
          <th>Trend</th>
          <th>Usual mistake</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.skill.id} data-skill={row.skill.id}>
            <td>{row.skill.name}</td>
            <td>{row.skill.standard}</td>
            <td>
              {row.attempts > 0 ? (
                <>
                  <span className="bar">
                    <i style={{ width: `${row.mastery}%` }} />
                  </span>
                  {row.mastery}%
                </>
              ) : (
                '—'
              )}
            </td>
            <td>{STATUS_LABEL[row.status]}</td>
            <td>
              {row.trend ? `${TREND_LABEL[row.trend].arrow} ${TREND_LABEL[row.trend].text}` : '—'}
            </td>
            <td>{row.topError ? ERROR_LABEL[row.topError] : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Activity({ days }: { days: DayActivity[] }) {
  const tallest = Math.max(10, ...days.map((d) => d.minutes));
  return (
    <>
      <div className="days" aria-label="Minutes of practice per day">
        {days.map((day) => (
          <div
            key={day.date}
            className={`day ${day.quests > 0 ? 'quest' : ''}`}
            data-date={day.date}
            title={`${day.date}: ${day.minutes} minutes`}
            style={{ height: `${(day.minutes / tallest) * 100}%` }}
          />
        ))}
      </div>
      <div className="ticks">
        {days.map((day, i) => (
          <span key={day.date}>{i % 7 === 0 ? day.date.slice(5).replace('-', '/') : ''}</span>
        ))}
      </div>
    </>
  );
}

function Report({ view, today }: { view: Dashboard; today: string }) {
  const { child, progress, sessions, attempts } = view;
  const from = addDays(today, 1 - REPORT_DAYS);
  const month = activityBetween(from, today, sessions, attempts);
  const days = dailyActivity(today, REPORT_DAYS, sessions, attempts);
  const rows = skillRows(GRADE_1_SKILLS, progress.states, attempts);
  const summary = skillSummary(rows, GRADE_1_SKILLS, progress.states);
  const add = factGrid('add', progress.cards);
  const sub = factGrid('sub', progress.cards);
  const automatic = add.counts.automatic + sub.counts.automatic;
  const started = rows.filter((r) => r.attempts > 0).length;
  return (
    <>
      <div className="top">
        <h1>{child.name}: math progress</h1>
        <p>
          Grade {child.grade} · {shortDate(new Date(`${from}T12:00`).getTime())} to{' '}
          {shortDate(new Date(`${today}T12:00`).getTime())}, {today.slice(0, 4)}
        </p>
      </div>
      <div className="stats" data-testid="report-stats">
        <div className="stat">
          <b>{month.quests}</b>Daily quests
        </div>
        <div className="stat">
          <b>{month.minutes}</b>Minutes
        </div>
        <div className="stat">
          <b>{month.problems}</b>Problems
        </div>
        <div className="stat">
          <b>{percent(month.accuracy)}</b>Right first try
        </div>
        <div className="stat">
          <b>
            {summary.mastered}/{rows.length}
          </b>
          Skills mastered
        </div>
        <div className="stat">
          <b>
            {progress.streak.current}/{progress.streak.best}
          </b>
          Streak now/best
        </div>
      </div>
      <ul className="notes">
        {started === 0 ? (
          <li>No practice recorded yet.</li>
        ) : (
          <>
            {summary.focus && (
              <li>
                <strong>Working on:</strong> {summary.focus.name}.
              </li>
            )}
            {summary.needsHelp.length > 0 && (
              <li>
                <strong>Could use extra help:</strong>{' '}
                {summary.needsHelp
                  .slice(0, 3)
                  .map((r) => r.skill.name)
                  .join(', ')}
                .
              </li>
            )}
            {summary.commonError && (
              <li>
                <strong>Most common mistake:</strong>{' '}
                {ERROR_LABEL[summary.commonError].toLowerCase()}.
              </li>
            )}
            <li>
              <strong>Fact fluency:</strong> {automatic} of 242 addition and subtraction facts are
              automatic.
            </li>
          </>
        )}
      </ul>
      <section>
        <h2>Skills (selected Grade 1 standards)</h2>
        <SkillTable rows={rows} />
      </section>
      <section>
        <h2>Fact fluency: addends 0–10 and their subtraction facts</h2>
        <div className="facts">
          <div>
            <p>Row + column</p>
            <FactTable grid={add} cell={13} />
          </div>
          <div>
            <p>(Row + column) − row</p>
            <FactTable grid={sub} cell={13} />
          </div>
          <div className="legend">
            <HeatLegend grids={[add, sub]} />
          </div>
        </div>
      </section>
      <section>
        <h2>Last {REPORT_DAYS} days: minutes of practice (dark = finished the daily quest)</h2>
        <Activity days={days} />
      </section>
      <footer>
        Mastery is a rolling score from accuracy and speed; 80 or more over at least 15 tries earns
        a skill. “Passed warm-up” means the child showed this in a short placement check. Trend
        compares the latest first-try accuracy with the answers before it, so harder problems can
        lower it while a child improves. Made by {APP_NAME} at home, from this child’s own practice.
      </footer>
    </>
  );
}

/** One complete HTML document, so preview, print and a shared file are all the same page. */
export function reportDoc(view: Dashboard, today: string): string {
  const body = renderToStaticMarkup(<Report view={view} today={today} />);
  const title = `${view.child.name} math progress ${today}`.replace(/[<&]/g, '');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

export const reportFileName = (name: string, today: string): string =>
  `${name.replace(/[^\p{L}\p{N}]+/gu, '-')}-math-report-${today}.html`;
