/**
 * templateStore.test.ts
 * Sprint42 E3: Canvas 模板系统 — IndexedDB template store tests
 *
 * Uses vi.mock to mock the `idb` library, enabling tests in jsdom environment.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock idb before importing templateStore ───────────────────────────────────

/** In-memory store to simulate IndexedDB */
const memoryStore = new Map<string, unknown>();

const mockDB = {
  put: vi.fn(async (_storeName: string, record: { id: string; [key: string]: unknown }) => {
    memoryStore.set(record.id, record);
  }),
  get: vi.fn(async (_storeName: string, id: string) => {
    return memoryStore.get(id);
  }),
  getAll: vi.fn(async (_storeName: string) => {
    return Array.from(memoryStore.values());
  }),
  delete: vi.fn(async (_storeName: string, id: string) => {
    memoryStore.delete(id);
  }),
  transaction: vi.fn(() => ({
    store: {
      get: vi.fn(async (id: string) => memoryStore.get(id)),
      put: vi.fn(async (record: { id: string }) => {
        memoryStore.set(record.id, record);
      }),
    },
    done: Promise.resolve(),
  })),
};

vi.mock('idb', () => ({
  openDB: vi.fn(async () => mockDB),
}));

// ─── Import after mocking ───────────────────────────────────────────────────────

import {
  createTemplate,
  getTemplate,
  listTemplates,
  deleteTemplate,
  updateTemplate,
  seedPresets,
  PRESET_TEMPLATES,
  type CanvasTemplateData,
} from '../templateStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeTemplate = (id: string, name: string, isPreset = false): CanvasTemplateData => ({
  id,
  name,
  description: `Description for ${name}`,
  icon: '📝',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  snapshot: JSON.stringify({ schemaVersion: '1.2.0', chapters: [], crossChapterEdges: [] }),
  tags: ['test'],
  isPreset,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('templateStore CRUD', () => {
  beforeEach(async () => {
    memoryStore.clear();
    vi.clearAllMocks();
  });

  it('creates and retrieves a template', async () => {
    const t = makeTemplate('test-template-1', 'Test Template');
    await createTemplate(t);

    expect(mockDB.put).toHaveBeenCalled();
    const found = await getTemplate('test-template-1');
    expect(found).not.toBeUndefined();
    expect(found!.id).toBe('test-template-1');
    expect(found!.name).toBe('Test Template');
  });

  it('listTemplates returns all templates sorted by updatedAt descending', async () => {
    const t1 = makeTemplate('test-template-1', 'First');
    const t2 = makeTemplate('test-template-2', 'Second');
    await createTemplate(t1);
    await createTemplate(t2);

    const list = await listTemplates();
    const ids = list.map((t) => t.id);
    expect(ids).toContain('test-template-1');
    expect(ids).toContain('test-template-2');
  });

  it('updateTemplate modifies existing template', async () => {
    await createTemplate(makeTemplate('test-template-1', 'Original'));
    vi.clearAllMocks();
    mockDB.get.mockResolvedValueOnce({
      id: 'test-template-1',
      name: 'Original',
      description: 'desc',
      icon: '📝',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      snapshot: '{}',
      tags: [],
      isPreset: false,
    });

    await updateTemplate('test-template-1', { name: 'Updated Name' });
    expect(mockDB.put).toHaveBeenCalled();
  });

  it('deleteTemplate removes template', async () => {
    await createTemplate(makeTemplate('test-template-1', 'To Delete'));
    vi.clearAllMocks();
    mockDB.get.mockResolvedValueOnce({
      id: 'test-template-1',
      name: 'To Delete',
      description: '',
      icon: '📝',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      snapshot: '{}',
      tags: [],
      isPreset: false,
    });

    await deleteTemplate('test-template-1');
    expect(mockDB.delete).toHaveBeenCalled();
  });

  it('deleteTemplate refuses to delete preset templates', async () => {
    mockDB.get.mockResolvedValueOnce({
      id: 'preset-blank',
      name: 'Blank',
      description: '',
      icon: '📄',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      snapshot: '{}',
      tags: [],
      isPreset: true,
    });

    await deleteTemplate('preset-blank');
    expect(mockDB.delete).not.toHaveBeenCalled();
  });
});

describe('PRESET_TEMPLATES', () => {
  it('has exactly 5 preset templates', () => {
    expect(PRESET_TEMPLATES).toHaveLength(5);
  });

  it('each preset has required fields', () => {
    for (const preset of PRESET_TEMPLATES) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.icon).toBeTruthy();
      expect(preset.snapshot).toBeTruthy();
      expect(preset.isPreset).toBe(true);
      expect(() => JSON.parse(preset.snapshot)).not.toThrow();
    }
  });

  it('each preset has a valid snapshot schema', () => {
    for (const preset of PRESET_TEMPLATES) {
      const parsed = JSON.parse(preset.snapshot);
      expect(parsed.schemaVersion).toBe('1.2.0');
      expect(Array.isArray(parsed.chapters)).toBe(true);
      expect(Array.isArray(parsed.crossChapterEdges)).toBe(true);
    }
  });

  it('preset IDs are unique', () => {
    const ids = PRESET_TEMPLATES.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('seedPresets', () => {
  beforeEach(async () => {
    memoryStore.clear();
    vi.clearAllMocks();
  });

  it('seeds preset templates without overwriting existing user templates', async () => {
    // Pre-existing user template
    memoryStore.set('user-custom', {
      id: 'user-custom',
      name: 'My Custom Template',
      description: 'custom',
      icon: '🧪',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      snapshot: '{}',
      tags: [],
      isPreset: true,
    });

    // Mock: get returns null for new presets (they don't exist yet)
    const getCalls: string[] = [];
    mockDB.get.mockImplementation(async (_store: string, id: string) => {
      getCalls.push(id);
      return memoryStore.get(id);
    });

    await seedPresets(PRESET_TEMPLATES);

    // Custom template should still exist
    expect(memoryStore.get('user-custom')).toBeTruthy();
    expect((memoryStore.get('user-custom') as { name: string }).name).toBe('My Custom Template');
  });
});
