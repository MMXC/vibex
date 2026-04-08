// F-5.1 + F-5.2: CanvasToolbar / TreeToolbar JSDoc 澄清
// Epic 5 | 组件命名澄清

/**
 * F-5.1: CanvasToolbar.tsx 添加 JSDoc，声明"画布级全局操作"职责
 * F-5.2: TreeToolbar.tsx 添加 JSDoc，声明"树级操作"职责
 */

import { defineFeature } from './spec-helpers'

export default defineFeature({
  id: 'F-5.1',
  title: 'CanvasToolbar JSDoc 完善',
  epic: 'Epic 5: 组件命名澄清',
  page: '[Canvas]',

  acceptanceCriteria: [
    {
      id: 'AC-5.1-1',
      description: 'CanvasToolbar.tsx 顶部有 JSDoc 注释',
      expect: `expect(canvasToolbarSource).toMatch(/^\\/\\*\\*[\\s\\S]*?\\*\\//)`,
    },
    {
      id: 'AC-5.1-2',
      description: 'JSDoc 提到"画布"或"全局"或"canvas"',
      expect: `expect(jsdoc).toMatch(/画布|canvas|全局|global/i)`,
    },
    {
      id: 'AC-5.1-3',
      description: 'CanvasToolbar 不导入 TreeToolbar',
      expect: `expect(canvasToolbarSource).not.toMatch(/import.*TreeToolbar/)`,
    },
    {
      id: 'AC-5.1-4',
      description: 'CanvasToolbar 不引用 TreeToolbar（防止交叉导入）',
      expect: `expect(canvasToolbarSource).not.toMatch(/TreeToolbar/)`,
    },
  ],

  dod: [
    'JSDoc 存在于 CanvasToolbar.tsx 顶部',
    'JSDoc 清楚说明"画布级操作"职责（UndoRedo, ZoomControls）',
    'CanvasToolbar 与 TreeToolbar 无交叉引用',
  ],
})

export const f52Spec = defineFeature({
  id: 'F-5.2',
  title: 'TreeToolbar JSDoc 完善',
  epic: 'Epic 5: 组件命名澄清',
  page: '[Canvas]',

  acceptanceCriteria: [
    {
      id: 'AC-5.2-1',
      description: 'TreeToolbar.tsx 顶部有 JSDoc 注释',
      expect: `expect(treeToolbarSource).toMatch(/^\\/\\*\\*[\\s\\S]*?\\*\\//)`,
    },
    {
      id: 'AC-5.2-2',
      description: 'JSDoc 提到"树"或"tree"',
      expect: `expect(jsdoc).toMatch(/树|tree|toolbar/i)`,
    },
    {
      id: 'AC-5.2-3',
      description: 'TreeToolbar 不导入 CanvasToolbar',
      expect: `expect(treeToolbarSource).not.toMatch(/import.*CanvasToolbar/)`,
    },
    {
      id: 'AC-5.2-4',
      description: 'TreeToolbar 不引用 CanvasToolbar（防止交叉导入）',
      expect: `expect(treeToolbarSource).not.toMatch(/CanvasToolbar/)`,
    },
  ],

  dod: [
    'JSDoc 存在于 TreeToolbar.tsx 顶部',
    'JSDoc 清楚说明"树级操作"职责（全选/取消/清空/继续）',
    'TreeToolbar 与 CanvasToolbar 无交叉引用',
  ],
})
