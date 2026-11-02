import type { ErrorType, FactHeat, MapStatus, Trend } from '@mathapp/engine';

export const ERROR_LABEL: Record<ErrorType, string> = {
  'off-by-one': 'Off by one',
  'reversed-operation': 'Mixed up + and −',
  'place-value': 'Mixed up tens and ones',
  'didnt-regroup': "Didn't regroup",
  'digit-swap': 'Swapped digits',
  other: 'Other',
};

export const STATUS_LABEL: Record<MapStatus, string> = {
  mastered: 'Mastered',
  passed: 'Passed warm-up',
  current: 'Working on now',
  open: 'Ready to start',
  locked: 'Not yet',
};

export const TREND_LABEL: Record<Trend, { arrow: string; text: string }> = {
  up: { arrow: '↑', text: 'improving' },
  steady: { arrow: '→', text: 'steady' },
  down: { arrow: '↓', text: 'dipping' },
};

/** One dark-to-light ramp, so it survives color blindness and a black-and-white printer. */
export const HEAT_STYLE: Record<FactHeat, { color: string; label: string; detail: string }> = {
  automatic: {
    color: '#1d3557',
    label: 'Automatic',
    detail: 'right within 3 seconds, 9 of the last 10 times',
  },
  quick: { color: '#5fa8d3', label: 'Getting quick', detail: 'last 2 right within 3 seconds' },
  working: { color: '#cfe6f3', label: 'Still working', detail: 'practiced, not quick yet' },
  unseen: { color: '#ffffff', label: 'Not yet seen', detail: '' },
};

export const percent = (value: number | undefined): string =>
  value === undefined ? '—' : `${Math.round(value * 100)}%`;

export const shortDate = (at: number): string =>
  new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
