// Mock zustand persist middleware — bypasses localStorage for tests
// All other zustand middleware are re-exported from real module

export { devtools } from 'zustand/middleware';
export { subscribeWithSelector } from 'zustand/middleware';

type PersistFn = (
  set: (...args: unknown[]) => unknown,
  get: () => unknown,
  store: unknown
) => unknown;

type RestoreFn<T> = (state: T) => T;

type PersistCreator<T> = (initial: T, restore: RestoreFn<T>) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const persist = <T extends Record<string, unknown>>(
  fn: PersistCreator<T>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _config?: unknown
): PersistFn => {
  return (set, get, store) => {
    const initialState = {} as T;
    const restore: RestoreFn<T> = (state: T) => state;
    return fn(initialState, restore);
  };
};
