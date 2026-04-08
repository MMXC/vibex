// F-1.2: 替换 CanvasPage 中的快捷键面板引用
// Epic 1 | 快捷键面板统一

/**
 * 目标: 将 CanvasPage.tsx 中对 ShortcutHintPanel 和 ShortcutHelpPanel 的导入和渲染
 *       替换为单一的 ShortcutPanel
 *
 * 变更位置: CanvasPage.tsx 第 67-68 行（导入）+ 第 718-726 行（渲染）
 */

import { defineFeature } from './spec-helpers'

export default defineFeature({
  id: 'F-1.2',
  title: 'CanvasPage 引用替换为 ShortcutPanel',
  epic: 'Epic 1: 快捷键面板统一',
  page: '[Canvas]',

  setup() {
    // TODO: 读取当前 CanvasPage.tsx 源码，验证导入和渲染语句
  },

  acceptanceCriteria: [
    {
      id: 'AC-1.2-1',
      description: 'CanvasPage 不导入 ShortcutHintPanel',
      expect: `expect(canvasPageSource).not.toMatch(/import.*ShortcutHintPanel.*from/)`,
    },
    {
      id: 'AC-1.2-2',
      description: 'CanvasPage 不导入 ShortcutHelpPanel',
      expect: `expect(canvasPageSource).not.toMatch(/import.*ShortcutHelpPanel.*from/)`,
    },
    {
      id: 'AC-1.2-3',
      description: 'CanvasPage 导入 ShortcutPanel',
      expect: `expect(canvasPageSource).toMatch(/import.*ShortcutPanel.*from.*features/)`,
    },
    {
      id: 'AC-1.2-4',
      description: 'CanvasPage 只渲染一个 <ShortcutPanel />',
      expect: `expect((canvasPageSource.match(/<ShortcutPanel/g) || []).length).toBe(1)`,
    },
  ],

  dod: [
    'CanvasPage.tsx 中无 ShortcutHintPanel 导入',
    'CanvasPage.tsx 中无 ShortcutHelpPanel 导入',
    'CanvasPage.tsx 中只有一个 <ShortcutPanel /> 渲染',
    '页面仍可正常加载，无 JSX 语法错误',
  ],
})
