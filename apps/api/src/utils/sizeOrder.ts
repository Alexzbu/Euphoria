const CANONICAL_RUN: readonly string[] = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];

export function compareSizeSlugs(a: string, b: string): number {
  const left = CANONICAL_RUN.indexOf(a);
  const right = CANONICAL_RUN.indexOf(b);

  if (left !== -1 && right !== -1) return left - right;
  // anything not in the run (numeric waist sizes, e.g.) sorts after it
  if (left !== -1) return -1;
  if (right !== -1) return 1;

  const [leftNumber, rightNumber] = [Number(a), Number(b)];
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return a.localeCompare(b);
}
