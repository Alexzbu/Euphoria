type ClassValue = string | false | null | undefined;

// css module lookups are typed as possibly-undefined, and a template literal turns
// that into the literal word "undefined" in the class list
export const cx = (...values: ClassValue[]): string => values.filter(Boolean).join(' ');
