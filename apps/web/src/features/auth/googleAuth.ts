import { API_URL, GOOGLE_AUTH_ENABLED } from '../../config/env';

export { GOOGLE_AUTH_ENABLED };

// Google sends the browser to the api, which sets the refresh cookie and bounces
// it back to /auth/callback. Nothing about where the visitor was going survives
// that round trip, so it waits here in session storage: same tab, gone when the
// tab is.
const RETURN_KEY = 'euphoria_oauth_return';

export function startGoogleSignIn(destination: string): void {
  try {
    window.sessionStorage.setItem(RETURN_KEY, destination);
  } catch {
    // storage refused, we just lose the return path and land on the home page
  }

  // a full navigation, not a fetch: the whole point is that the browser follows
  // google's redirects and comes back holding a cookie
  window.location.assign(`${API_URL}/auth/google`);
}

export function consumeReturnPath(fallback: string): string {
  try {
    const stored = window.sessionStorage.getItem(RETURN_KEY);
    window.sessionStorage.removeItem(RETURN_KEY);
    return stored ?? fallback;
  } catch {
    return fallback;
  }
}
