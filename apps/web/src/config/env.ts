// vite inlines import.meta.env at build time, so a wrong value here is a broken
// bundle, not a broken request at 3am. trailing slash stripped once, since every
// path in the api layer starts with one.
const DEFAULT_API_URL = 'http://localhost:3000/api';

export const API_URL = (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');
