const CRLF = '\r\n';

const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** The format allows 75 bytes a line; longer lines continue on one that starts with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  for (const char of line) {
    if (bytes.encode(current + char).length > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = '';
    }
    current += char;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

const pad = (n: number) => String(n).padStart(2, '0');

const utcStamp = (at: number) => {
  const d = new Date(at);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
};

export interface ReminderInput {
  uid: string;
  name: string;
  appName: string;
  /** "HH:MM", the parent's own local time. */
  time: string;
  /** YYYY-MM-DD: the first day. */
  from: string;
  at: number;
}

/**
 * A repeating calendar event with an alert. A web app with no server can't wake itself to
 * notify anyone, but the phone's own calendar can, and it works offline.
 * The time has no time zone on purpose, so it follows the family when they travel.
 */
export function reminderCalendar({ uid, name, appName, time, from, at }: ReminderInput): string {
  const clock = time.replace(':', '');
  const start = `${from.replaceAll('-', '')}T${clock}00`;
  const title = escapeText(`${name}'s math time`);
  const message = escapeText(`The bear says: it's time for today's ${appName}!`);
  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Home//Math Practice//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${utcStamp(at)}`,
      `DTSTART:${start}`,
      'DURATION:PT10M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${title}`,
      `DESCRIPTION:${message}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${message}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .map(fold)
      .join(CRLF) + CRLF
  );
}
