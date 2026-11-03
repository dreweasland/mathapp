import { ALL_SKILLS } from '@mathapp/content';
import { activeGrade, factGrid } from '@mathapp/engine';
import { FactTable, HeatLegend } from '../FactTable';
import type { PageProps } from '../ParentApp';

export function Facts({ view }: PageProps) {
  const add = factGrid('add', view.progress.cards);
  const sub = factGrid('sub', view.progress.cards);
  const later = activeGrade(ALL_SKILLS, view.progress.states) === 3;
  const mul = factGrid('mul', view.progress.cards);
  const div = factGrid('div', view.progress.cards);
  return (
    <>
      <section className="p-card">
        <HeatLegend grids={later ? [add, sub, mul, div] : [add, sub]} />
      </section>
      <section className="p-card overflow-x-auto">
        <h2 className="font-extrabold">Addition: row + column</h2>
        <FactTable grid={add} cell={25} />
      </section>
      <section className="p-card overflow-x-auto">
        <h2 className="font-extrabold">Subtraction: (row + column) − row</h2>
        <FactTable grid={sub} cell={25} />
      </section>
      {later && (
        <>
          <section className="p-card overflow-x-auto">
            <h2 className="font-extrabold">Multiplication: row × column</h2>
            <FactTable grid={mul} cell={27} />
          </section>
          <section className="p-card overflow-x-auto">
            <h2 className="font-extrabold">Division: (row × column) ÷ row</h2>
            <FactTable grid={div} cell={27} />
          </section>
        </>
      )}
    </>
  );
}
