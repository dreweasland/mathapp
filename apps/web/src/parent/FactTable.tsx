import type { FactGrid } from '@mathapp/engine';
import { HEAT_STYLE } from './labels';

const SIDE = Array.from({ length: 11 }, (_, i) => i);

/** Inline styles, because the same table goes into the standalone teacher report. */
export function FactTable({ grid, cell = 22 }: { grid: FactGrid; cell?: number }) {
  const add = grid.op === 'add';
  const head = { fontSize: cell * 0.5, fontWeight: 700, textAlign: 'center' as const, padding: 0 };
  return (
    <table
      data-testid={`facts-${grid.op}`}
      aria-label={add ? 'Addition facts' : 'Subtraction facts'}
      style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
    >
      <thead>
        <tr>
          <th style={{ ...head, width: cell, height: cell }}>{add ? '+' : '−'}</th>
          {SIDE.map((n) => (
            <th key={n} style={{ ...head, width: cell }}>
              {n}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {grid.rows.map((row, r) => (
          <tr key={r}>
            <th style={{ ...head, height: cell }}>{r}</th>
            {row.map((fact) => (
              <td
                key={fact.id}
                title={`${fact.label}: ${HEAT_STYLE[fact.heat].label}`}
                data-fact={fact.id}
                data-heat={fact.heat}
                style={{
                  background: HEAT_STYLE[fact.heat].color,
                  border: '1px solid #8fa3b5',
                  height: cell,
                  width: cell,
                  padding: 0,
                }}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HeatLegend({ grids }: { grids: FactGrid[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} data-testid="heat-legend">
      {(['automatic', 'quick', 'working', 'unseen'] as const).map((heat) => {
        const { color, label, detail } = HEAT_STYLE[heat];
        const count = grids.reduce((total, g) => total + g.counts[heat], 0);
        return (
          <li key={heat} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'start' }}>
            <span
              style={{
                background: color,
                border: '1px solid #8fa3b5',
                flex: 'none',
                height: 13,
                marginTop: 2,
                width: 13,
              }}
            />
            <span>
              <strong>{count}</strong> {label}
              {detail && <span style={{ display: 'block', fontSize: '0.85em' }}>{detail}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
