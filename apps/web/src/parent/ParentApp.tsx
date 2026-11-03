import type { ChildProfile } from '@mathapp/engine';
import { useCallback, useEffect, useState } from 'react';
import type { Dashboard } from '../db/repositories/parent';
import { localDate } from '../game/today';
import { Children } from './pages/Children';
import { Data } from './pages/Data';
import { Facts } from './pages/Facts';
import { Motivate } from './pages/Motivate';
import { Overview } from './pages/Overview';
import { Report } from './pages/Report';
import { Settings } from './pages/Settings';
import { Skills } from './pages/Skills';
import type { ParentServices } from './services';
import { AvatarName } from '../ui/Avatar';

const PAGES = [
  { id: 'skills', label: 'Skills', hint: 'Mastery, trend and usual mistakes' },
  { id: 'facts', label: 'Fact fluency', hint: 'Which facts are automatic' },
  { id: 'motivate', label: 'Goals & cheers', hint: 'Real-world rewards and messages' },
  { id: 'report', label: 'Teacher report', hint: 'One printable page' },
  { id: 'children', label: 'Children', hint: 'Edit, add, or start over' },
  { id: 'settings', label: 'Settings', hint: 'Voice, hand, motion, colors, math time' },
  { id: 'data', label: 'Backup', hint: 'Save or restore all progress' },
] as const;

type Page = (typeof PAGES)[number]['id'];

export function ParentApp({ services, onExit }: { services: ParentServices; onExit: () => void }) {
  const { repo, now } = services;
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [childId, setChildId] = useState<string>();
  const [view, setView] = useState<Dashboard>();
  const [page, setPage] = useState<Page>();
  const today = localDate(new Date(now()));

  /** Called after every change, so each page shows what's really stored. */
  const reload = useCallback(
    async (nextId?: string) => {
      const everyone = await repo.children();
      const chosen = everyone.find((c) => c.id === (nextId ?? childId)) ?? everyone[0];
      setChildren(everyone);
      setChildId(chosen?.id);
      setView(chosen ? await repo.dashboard(chosen) : undefined);
    },
    [repo, childId],
  );

  useEffect(() => {
    void reload();
    // Only on opening: later changes call reload themselves.
  }, []);

  if (!view) return null;
  const pageInfo = PAGES.find((p) => p.id === page);
  const shared = { view, today, services, reload };

  return (
    <main className="parent" data-testid="parent">
      <div className="parent-page">
        <header className="flex items-center justify-between gap-2">
          {page ? (
            <button type="button" className="p-btn" onClick={() => setPage(undefined)}>
              ‹ Back
            </button>
          ) : (
            <h1 className="text-2xl font-extrabold">Grown-ups</h1>
          )}
          {pageInfo && <h1 className="text-xl font-extrabold">{pageInfo.label}</h1>}
          <button type="button" className="p-btn" onClick={onExit}>
            Done
          </button>
        </header>

        {children.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Child">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                aria-pressed={child.id === childId}
                className={`p-btn ${child.id === childId ? 'p-btn-main' : ''}`}
                onClick={() => void reload(child.id)}
              >
                <AvatarName avatar={child.avatar} name={child.name} size={22} />
              </button>
            ))}
          </div>
        )}

        {page === undefined && (
          <>
            <Overview {...shared} />
            <nav className="flex flex-col gap-2">
              {PAGES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="p-card flex items-center justify-between text-left"
                  onClick={() => setPage(p.id)}
                >
                  <span>
                    <span className="block font-extrabold">{p.label}</span>
                    <span className="block text-sm">{p.hint}</span>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </nav>
          </>
        )}
        {page === 'skills' && <Skills {...shared} />}
        {page === 'facts' && <Facts {...shared} />}
        {page === 'motivate' && <Motivate {...shared} />}
        {page === 'report' && <Report {...shared} />}
        {page === 'children' && <Children {...shared} everyone={children} />}
        {page === 'settings' && <Settings key={view.child.id} {...shared} />}
        {page === 'data' && <Data {...shared} />}
      </div>
    </main>
  );
}

export interface PageProps {
  view: Dashboard;
  today: string;
  services: ParentServices;
  reload: (childId?: string) => Promise<void>;
}
