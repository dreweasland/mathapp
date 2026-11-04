import { db } from '../db/db';
import { httpApi } from './api';
import { createSync } from './client';

/** The API lives on the same origin as the app, under /api/. */
const base = new URL('.', document.baseURI).href.replace(/\/$/, '');

export const sync = createSync({
  db,
  api: httpApi(base),
  now: Date.now,
  timeZone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
});
