/**
 * templateStore.ts — Canvas Template IndexedDB Store
 * Sprint42 E3: Canvas 模板系统
 *
 * IndexedDB persistence for canvas templates using the `idb` library.
 * Provides CRUD operations: create, list, get, delete.
 *
 * DB schema:
 *   - DB name: vibex-canvas-templates
 *   - Store name: templates
 *   - Key: template id (string)
 *   - Indexes: createdAt (for sorting)
 */

import { openDB, type IDBPDatabase } from 'idb';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CanvasTemplateData {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last modification */
  updatedAt: string;
  /** Serialized canvas snapshot (JSON string) */
  snapshot: string;
  /** Canvas layout category: flowchart/mindmap/uml/other */
  category: 'flowchart' | 'mindmap' | 'uml' | 'other' | null;
  /** Tags for filtering */
  tags: string[];
  /** Whether this is a built-in preset template */
  isPreset: boolean;
  /** Optional thumbnail: SVG data URL or external image URL */
  thumbnail?: string;
}

export interface CanvasTemplateSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  isPreset: boolean;
  category: 'flowchart' | 'mindmap' | 'uml' | 'other' | null;
  tags: string[];
  /** Optional thumbnail: SVG data URL or external image URL */
  thumbnail?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DB_NAME = 'vibex-canvas-templates';
const DB_VERSION = 1;
const STORE_NAME = 'templates';

// ─── DB Connection ───────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('updatedAt', 'updatedAt');
          store.createIndex('isPreset', 'isPreset');
        }
      },
    });
  }
  return dbPromise;
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/**
 * Create a new canvas template.
 * Overwrites if id already exists.
 */
export async function createTemplate(template: CanvasTemplateData): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, {
    ...template,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * List all templates, sorted by most recently updated.
 * Returns summaries without the full snapshot payload.
 */
export async function listTemplates(includePresets = true): Promise<CanvasTemplateSummary[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);

  const filtered = includePresets ? all : all.filter((t) => !t.isPreset);

  return filtered
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(({ snapshot: _snapshot, ...summary }) => summary as CanvasTemplateSummary);
}

/**
 * Get a single template by id. Returns undefined if not found.
 */
export async function getTemplate(id: string): Promise<CanvasTemplateData | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

/**
 * Delete a template by id.
 * Preset templates (isPreset=true) cannot be deleted.
 */
export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) return;
  if (existing.isPreset) {
    console.warn('[templateStore] Cannot delete preset template:', id);
    return;
  }
  await db.delete(STORE_NAME, id);
}

/**
 * Update an existing template's metadata or snapshot.
 */
export async function updateTemplate(
  id: string,
  patch: Partial<Pick<CanvasTemplateData, 'name' | 'description' | 'icon' | 'category' | 'tags' | 'snapshot' | 'thumbnail'>>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) throw new Error(`Template not found: ${id}`);
  const updated: CanvasTemplateData = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await db.put(STORE_NAME, updated);
}

/**
 * Seed preset templates into IndexedDB if they don't already exist.
 * Called once on app boot.
 */
export async function seedPresets(presets: CanvasTemplateData[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all(
    presets.map(async (preset) => {
      const existing = await tx.store.get(preset.id);
      if (!existing) {
        await tx.store.put(preset);
      }
    })
  );
  await tx.done;
}

// ─── Preset Templates ─────────────────────────────────────────────────────────

/** Preset template definitions for the 5 built-in canvas templates. */
export const PRESET_TEMPLATES: CanvasTemplateData[] = [
  {
    id: 'preset-blank',
    name: '空白画布',
    description: '从零开始创建你的 DDD 架构图',
    icon: '📄',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    snapshot: JSON.stringify({ schemaVersion: '1.2.0', chapters: [], crossChapterEdges: [] }),
    category: null,
    tags: ['blank'],
    isPreset: true,
  },
  {
    id: 'preset-flowchart',
    name: '流程图',
    description: '5 节点线性流程图，适合展示业务流程',
    icon: '🔀',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    snapshot: JSON.stringify({
      schemaVersion: '1.2.0',
      chapters: [
        {
          id: 'ch-1',
          title: '主流程',
          type: 'flow',
          contextNodes: [
            {
              nodeId: 'ctx-1',
              name: '开始',
              description: '流程起点',
              type: 'core',
              confirmed: false,
              status: 'pending',
              children: [],
              relationships: [{ sourceId: 'ctx-1', targetId: 'ctx-2', type: 'dependency', label: '' }],
            },
            {
              nodeId: 'ctx-2',
              name: '步骤一',
              description: '执行主要任务',
              type: 'core',
              confirmed: false,
              status: 'pending',
              children: [],
              relationships: [{ sourceId: 'ctx-2', targetId: 'ctx-3', type: 'dependency', label: '' }],
            },
            {
              nodeId: 'ctx-3',
              name: '步骤二',
              description: '处理输入数据',
              type: 'core',
              confirmed: false,
              status: 'pending',
              children: [],
              relationships: [{ sourceId: 'ctx-3', targetId: 'ctx-4', type: 'dependency', label: '' }],
            },
            {
              nodeId: 'ctx-4',
              name: '步骤三',
              description: '执行计算逻辑',
              type: 'core',
              confirmed: false,
              status: 'pending',
              children: [],
              relationships: [{ sourceId: 'ctx-4', targetId: 'ctx-5', type: 'dependency', label: '' }],
            },
            {
              nodeId: 'ctx-5',
              name: '结束',
              description: '输出结果并结束',
              type: 'core',
              confirmed: false,
              status: 'pending',
              children: [],
              relationships: [],
            },
          ],
          flowNodes: [],
          componentNodes: [],
        },
      ],
      crossChapterEdges: [],
    }),
    category: null,
        tags: ['flow', 'process'],
    isPreset: true,
  },
  {
    id: 'preset-four-quadrant',
    name: '四象限矩阵',
    description: '2×2 四象限矩阵，适合优先级决策或分类分析',
    icon: '📊',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    snapshot: JSON.stringify({
      schemaVersion: '1.2.0',
      chapters: [
        {
          id: 'ch-quad',
          title: '四象限',
          type: 'context',
          contextNodes: [
            { nodeId: 'q1', name: '重要且紧急', description: '立即执行', type: 'core', confirmed: false, status: 'pending', children: [], relationships: [] },
            { nodeId: 'q2', name: '重要不紧急', description: '计划执行', type: 'core', confirmed: false, status: 'pending', children: [], relationships: [] },
            { nodeId: 'q3', name: '紧急不重要', description: '委托他人', type: 'supporting', confirmed: false, status: 'pending', children: [], relationships: [] },
            { nodeId: 'q4', name: '不重要不紧急', description: '删除或忽略', type: 'generic', confirmed: false, status: 'pending', children: [], relationships: [] },
          ],
          flowNodes: [],
          componentNodes: [],
        },
      ],
      crossChapterEdges: [],
    }),
    category: null,
        tags: ['matrix', 'analysis'],
    isPreset: true,
  },
  {
    id: 'preset-mindmap',
    name: '思维导图',
    description: '中心节点 + 3 个子节点，适合头脑风暴和想法整理',
    icon: '🧠',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    snapshot: JSON.stringify({
      schemaVersion: '1.2.0',
      chapters: [
        {
          id: 'ch-mind',
          title: '思维导图',
          type: 'context',
          contextNodes: [
            { nodeId: 'root', name: '中心主题', description: '你的核心想法', type: 'core', confirmed: false, status: 'pending', children: [], relationships: [] },
            { nodeId: 'child-1', name: '分支一', description: '相关思路', type: 'core', confirmed: false, status: 'pending', children: [], relationships: [{ sourceId: 'root', targetId: 'child-1', type: 'dependency', label: '' }] },
            { nodeId: 'child-2', name: '分支二', description: '相关思路', type: 'core', confirmed: false, status: 'pending', children: [], relationships: [{ sourceId: 'root', targetId: 'child-2', type: 'dependency', label: '' }] },
            { nodeId: 'child-3', name: '分支三', description: '相关思路', type: 'core', confirmed: false, status: 'pending', children: [], relationships: [{ sourceId: 'root', targetId: 'child-3', type: 'dependency', label: '' }] },
          ],
          flowNodes: [],
          componentNodes: [],
        },
      ],
      crossChapterEdges: [],
    }),
    category: null,
        tags: ['mindmap', 'brainstorm'],
    isPreset: true,
  },
  {
    id: 'preset-swot',
    name: 'SWOT 分析',
    description: '优势/劣势/机会/威胁四维度分析框架',
    icon: '🔍',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    snapshot: JSON.stringify({
      schemaVersion: '1.2.0',
      chapters: [
        {
          id: 'ch-swot',
          title: 'SWOT 分析',
          type: 'context',
          contextNodes: [
            { nodeId: 'swot-s', name: '优势 Strengths', description: '内部有利因素', type: 'core', confirmed: false, status: 'pending', children: [], relationships: [] },
            { nodeId: 'swot-w', name: '劣势 Weaknesses', description: '内部不利因素', type: 'core', confirmed: false, status: 'pending', children: [], relationships: [] },
            { nodeId: 'swot-o', name: '机会 Opportunities', description: '外部有利因素', type: 'supporting', confirmed: false, status: 'pending', children: [], relationships: [] },
            { nodeId: 'swot-t', name: '威胁 Threats', description: '外部不利因素', type: 'supporting', confirmed: false, status: 'pending', children: [], relationships: [] },
          ],
          flowNodes: [],
          componentNodes: [],
        },
      ],
      crossChapterEdges: [],
    }),
    category: null,
        tags: ['swot', 'strategy'],
    isPreset: true,
  },
];

// ─── E4: Template Category & Tag Management ────────────────────────────────

export type CanvasTemplateCategory = 'flowchart' | 'mindmap' | 'uml' | 'other' | null;

/**
 * Set the canvas layout category for a template.
 */
export async function setTemplateCategory(
  id: string,
  category: CanvasTemplateCategory
): Promise<void> {
  await updateTemplate(id, { category });
}

/**
 * Add a tag to a template.
 */
export async function addTemplateTag(id: string, tag: string): Promise<void> {
  const existing = await getTemplate(id);
  if (!existing) throw new Error(`Template not found: ${id}`);
  const tags = existing.tags.includes(tag) ? existing.tags : [...existing.tags, tag];
  await updateTemplate(id, { tags });
}

/**
 * Remove a tag from a template.
 */
export async function removeTemplateTag(id: string, tag: string): Promise<void> {
  const existing = await getTemplate(id);
  if (!existing) throw new Error(`Template not found: ${id}`);
  const tags = existing.tags.filter((t) => t !== tag);
  await updateTemplate(id, { tags });
}

/**
 * Set or update the thumbnail for a template.
 */
export async function setTemplateThumbnail(id: string, thumbnail: string): Promise<void> {
  await updateTemplate(id, { thumbnail });
}
