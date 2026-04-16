/**
 * DDS Services — Persistence + Export/Import
 * @module services/dds
 */

export {
  saveSnapshot,
  loadLatestSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
  quickSave,
  quickLoad,
  clearLocalStorage,
  exportToJSON,
  parseImportFile,
  validateImportData,
  getStorageInfo,
  type SnapshotMeta,
  type StorageInfo,
} from './ddsPersistence';
