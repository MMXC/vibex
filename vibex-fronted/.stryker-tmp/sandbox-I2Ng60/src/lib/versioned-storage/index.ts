/**
 * VersionedStorage - Zustand persistence with schema migrations
 * E3-T1: Provides automatic migration between schema versions
 */
// @ts-nocheck


import type { StateCreator } from 'zustand';

type Migration<V> = (state: V) => Partial<V>;

export interface StorageConfig<V> {
  version: number;
  migrations: Record<number, Migration<V>>;
  name: string;
}

export interface VersionedStorage {
  <V>(
    config: StorageConfig<V>,
    initializer: StateCreator<V, [], []>
  ): StateCreator<V, [], []>;
}

declare module 'zustand' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    versionedStorage: VersionedStorage;
  }
}

const versionedStorageImpl: VersionedStorage = (config, initializer) =>
  (set, get, store) => {
    const storedState = localStorage.getItem(config.name);

    if (storedState) {
      try {
        const parsed = JSON.parse(storedState);
        const storedVersion = parsed._version || 0;

        if (storedVersion < config.version) {
          // Apply migrations sequentially
          let migratedState = parsed;
          for (let v = storedVersion + 1; v <= config.version; v++) {
            const migration = config.migrations[v];
            if (migration) {
              migratedState = { ...migratedState, ...migration(migratedState) };
            }
          }
          migratedState._version = config.version;
          set(migratedState as Parameters<typeof set>[0]);
        }
      } catch (e) {
        console.error('Migration failed:', e);
      }
    }

    const initialState = initializer(set, get, store);
    return initialState;
  };

export const versionedStorage = versionedStorageImpl as VersionedStorage;

export function createVersionedStorage<V>(
  config: StorageConfig<V>,
  initializer: StateCreator<V, [], []>
) {
  return versionedStorage(config, initializer);
}
