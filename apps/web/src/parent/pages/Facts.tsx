import { factGrid } from '@mathapp/engine';
import { FactTable, HeatLegend } from '../FactTable';
import type { PageProps } from '../ParentApp';

export function Facts({ view }: PageProps) {
  const add = factGrid('add', view.progress.cards);
  const sub = factGrid('sub', view.progress.cards);
  return (
    <>
      <section className="p-card">
        <HeatLegend grids={[add, sub]} />
      </section>
      <section className="p-card overflow-x-auto">
        <h2 className="font-extrabold">Addition: row + column</h2>
        <FactTable grid={add} cell={25} />
      </section>
      <section className="p-card overflow-x-auto">
        <h2 className="font-extrabold">Subtraction: (row + column) − row</h2>
        <FactTable grid={sub} cell={25} />
      </section>
    </>
  );
}
