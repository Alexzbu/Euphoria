import '@vitest/expect';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// jest-dom ships its augmentation against `declare module 'vitest'`, and vitest 3
// moved the Assertion interface out to @vitest/expect. the matchers still register
// at runtime, they just land on an interface nothing looks at, so toBeInTheDocument
// stops type-checking. same augmentation, pointed where the interface actually is.
declare module '@vitest/expect' {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
  interface Assertion<T = any> extends TestingLibraryMatchers<unknown, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, any> {}
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
}
