import type { Location } from 'react-router-dom';

// ProtectedRoute hands on the location it blocked; a page sending someone to sign
// in first may just name a path. Both mean "come back here afterwards".
export function redirectTarget(state: unknown, fallback: string): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return fallback;

  const { from } = state as { from: unknown };
  if (typeof from === 'string') return from;

  if (typeof from === 'object' && from !== null && 'pathname' in from) {
    const location = from as Location;
    return `${location.pathname}${location.search}`;
  }

  return fallback;
}
