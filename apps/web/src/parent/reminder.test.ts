import { describe, expect, it } from 'vitest';
import { reminderCalendar } from './reminder';

const input = {
  uid: 'abc',
  name: 'Sam',
  appName: 'Math Quest',
  time: '16:30',
  from: '2026-11-02',
  at: Date.UTC(2026, 10, 2, 12, 5, 9),
};

describe('reminderCalendar', () => {
  it('repeats every day at the local time chosen, with no time zone', () => {
    const text = reminderCalendar(input);
    expect(text).toContain('DTSTART:20261102T163000\r\n');
    expect(text).toContain('RRULE:FREQ=DAILY\r\n');
    expect(text).not.toContain('TZID');
  });
  it('alerts at the event time', () => {
    const text = reminderCalendar(input);
    expect(text).toContain('BEGIN:VALARM');
    expect(text).toContain('TRIGGER:PT0M');
  });
  it('stamps the file in UTC, as the format requires', () => {
    expect(reminderCalendar(input)).toContain('DTSTAMP:20261102T120509Z');
  });
  it('uses CRLF line endings throughout', () => {
    expect(reminderCalendar(input).replaceAll('\r\n', '')).not.toMatch(/[\r\n]/);
  });
  it('escapes characters that mean something in the format', () => {
    const text = reminderCalendar({ ...input, name: 'Sam, the; great' });
    expect(text).toContain("SUMMARY:Sam\\, the\; great's math time");
  });
  it('folds long lines at 75 bytes, even through emoji', () => {
    const text = reminderCalendar({ ...input, name: '🦊'.repeat(40) });
    const encoder = new TextEncoder();
    for (const line of text.split('\r\n'))
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
  });
  it('folded lines unfold back to the original', () => {
    const name = 'A very long family nickname that keeps going and going for a while';
    const text = reminderCalendar({ ...input, name });
    expect(text.replaceAll('\r\n ', '')).toContain(name);
  });
  it('is warm: no pressure and nothing about losing anything', () => {
    expect(reminderCalendar(input)).not.toMatch(/streak|lose|hurry|don't miss|last chance/i);
  });
});
