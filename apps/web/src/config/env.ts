// vite inlines import.meta.env at build time, so a wrong value here is a broken
// bundle, not a broken request at 3am. trailing slash stripped once, since every
// path in the api layer starts with one.
const DEFAULT_API_URL = 'http://localhost:3000/api';

export const API_URL = (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');

// The api only mounts its Google routes when it has oauth credentials, and a
// browser can't tell from the outside. This flag is how a deployment says the
// button leads somewhere, so nobody is offered a sign-in that 404s.
export const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_GOOGLE_AUTH === 'true';
