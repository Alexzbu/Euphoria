// don't hand user input straight to the regex engine. `(a+)+$` typed into the
// search box backtracks for minutes and holds the event loop the whole time.
// escaping means the term can only match literally, so there's no way to write
// a quantifier at all.
const SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

export function escapeRegExp(value: string): string {
  return value.replace(SPECIAL_CHARACTERS, '\\$&');
}
