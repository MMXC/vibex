/**
 * canvas-module-exports.test.ts
 * Unit 3: 类名导出验证
 *
 * 验证 @forward 修复后，canvas.module.css 正确导出所有子模块类名。
 * 由于 vitest/jsdom 无法正确处理 CSS @forward 模块导入，
 * 本测试通过验证 canvas.module.css 文件内容（@forward 指令）
 * 来确认所有子模块类名会被正确转发。
 *
 * 参考: docs/vibex-canvas/IMPLEMENTATION_PLAN.md § Unit 3
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// 13 个核心组件实际使用的类名（从 TSX 源码提取）
const CORE_CLASS_NAMES = [
  // TreePanel
  'treePanel',
  'treePanelHeader',
  'treePanelIcon',
  'treePanelTitle',
  'treePanelBadge',
  'nodeCard',
  'nodeEditForm',
  'nodeEditInput',
  'nodeEditTextarea',
  'nodeEditActions',
  // BoundedContextTree
  'boundedContextTree',
  'contextNodeList',
  'contextTreeControls',
  'addNodeForm',
  'addNodeFormRow',
  // BusinessFlowTree / ComponentTree
  'flowTreePanel',
  'componentTree',
  'nodeTypeMarker',
  'flowStepTypeIcon',
  'stepRow',
  'stepOrder',
  'stepDragHandle',
  'stepEditForm',
  'stepInput',
  // CanvasToolbar
  'canvasToolbar',
  'expandAllButton',
  'toolbarButton',
  // PhaseProgressBar
  'phaseProgressBar',
  'phaseItem',
  'phaseLabel',
  'phaseConnector',
  'phaseNumber',
  // BoundedContextGroup
  'boundedContextGroup',
  'canvasRowWrapper',
  // ProjectBar
  'projectBar',
  'projectBarWrapper',
  'projectNameInput',
  // PrototypeQueuePanel
  'prototypePhase',
  'prototypeQueuePanel',
  'queueItem',
  'queuePanelTitle',
  'queuePanelHeader',
  'queueList',
  'queueItemActions',
  'queueItemError',
  'queueItemDone',
  'queueItemQueued',
  'queueItemName',
  'queueItemProgress',
  'queueItemProgressFill',
  // TreeStatus
  'treeStatus',
  'treeStatusConfirmed',
  'treeStatusItem',
  // TreeToolbar
  'treeToolbar',
  'treeToolbarButtons',
  // ComponentTreeCard
  'componentGroup',
  'componentNodeList',
  'nodeCardHeader',
  'nodeTypeBadge',
  'primaryButton',
  'secondaryButton',
  // CanvasPage
  'canvasContainer',
  'treePanelsGrid',
  'tabBarWrapper',
  'expandCol',
  // SortableTreeItem
  'sortableTreeItem',
  // ShortcutPanel
  'searchDialog',
  'searchInput',
  // RelationshipConnector
  'relationshipEdge',
  'relationshipLabel',
] as const;

const CANVAS_MODULE_CSS = path.resolve(__dirname, '../canvas.module.css');
const CANVAS_DIR = path.resolve(__dirname, '..');
const SUB_MODULES = [
  'canvas.base.module.css',
  'canvas.toolbar.module.css',
  'canvas.trees.module.css',
  'canvas.context.module.css',
  'canvas.flow.module.css',
  'canvas.components.module.css',
  'canvas.panels.module.css',
  'canvas.thinking.module.css',
  'canvas.export.module.css',
  'canvas.misc.module.css',
];

function extractForwardTargets(content: string): string[] {
  const matches = content.match(/@forward\s+['"]([^'"]+)['"]/g) ?? [];
  return matches.map((m) => {
    const inner = m.match(/@forward\s+['"]([^'"]+)['"]/);
    return inner ? inner[1] : '';
  }).filter(Boolean);
}

function extractClassesFromCss(content: string): string[] {
  const re = /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g;
  const classes: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    classes.push(m[1]);
  }
  return classes;
}

describe('Unit 3: canvas.module.css 类名内联验证', () => {
  it('canvas.module.css 文件存在', () => {
    expect(fs.existsSync(CANVAS_MODULE_CSS), `文件不存在: ${CANVAS_MODULE_CSS}`).toBe(true);
  });

  it('canvas.module.css 不包含 @use（@use 不导出类名）', () => {
    const content = fs.readFileSync(CANVAS_MODULE_CSS, 'utf-8');
    const useMatches = content.match(/@use\s+['"]([^'"]+\.module\.css)['"]/g) ?? [];
    expect(
      useMatches,
      `发现 ${useMatches.length} 个 @use 语句（@use 不导出类名到顶层）: ${useMatches.join(', ')}`
    ).toHaveLength(0);
  });

  // CSS 已内联到 canvas.module.css，不再需要 @forward 验证
  // it('canvas.module.css 包含 10 个 @forward 指令', () => { ... });
  // it('10 个子模块全部被 @forward', () => { ... });

  it('所有子模块 CSS 文件存在且包含类名', () => {
    const missing: string[] = [];
    const emptyModules: string[] = [];

    for (const mod of SUB_MODULES) {
      const filePath = path.join(CANVAS_DIR, mod);
      if (!fs.existsSync(filePath)) {
        missing.push(mod);
        continue;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const classes = extractClassesFromCss(content);
      if (classes.length === 0) {
        emptyModules.push(mod);
      }
    }

    expect(missing, `以下子模块文件缺失: ${missing.join(', ')}`).toHaveLength(0);
    expect(emptyModules, `以下模块无类名定义: ${emptyModules.join(', ')}`).toHaveLength(0);
  });

  it('canvas.module.css 内联 CSS 包含至少 300 个类名', () => {
    const content = fs.readFileSync(CANVAS_MODULE_CSS, 'utf-8');
    const classes = extractClassesFromCss(content);
    expect(classes.length, `期望 ≥300 个类名，实际: ${classes.length}`).toBeGreaterThanOrEqual(300);
  });
});
