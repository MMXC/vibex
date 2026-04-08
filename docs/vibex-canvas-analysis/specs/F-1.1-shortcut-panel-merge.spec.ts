// F-1.1: 创建统一 ShortcutPanel 组件
// Epic 1 | 快捷键面板统一

/**
 * 目标: 将 ShortcutHintPanel + ShortcutHelpPanel 合并为 features/ShortcutPanel.tsx
 *
 * 快捷键合并清单（去重后预期 13 条）:
 * - Ctrl+Z (Undo)
 * - Ctrl+G (Generate/分析)
 * - Ctrl+A (全选)
 * - Ctrl+K (清空)
 * - Del (删除选中)
 * - Esc (取消)
 * - N (新建节点)
 * - + / - (缩放)
 * - / (聚焦搜索)
 * - ? (打开面板)
 * - F11 (全屏)
 * - Alt+1 (切换 Tab1)
 * - Alt+2 (切换 Tab2)
 * - Alt+3 (切换 Tab3)
 *
 * 原始数量: ShortcutHintPanel 14条 + ShortcutHelpPanel 6条 - 重叠(?键) = 约 19条
 * 合并后预期: 约 13-14 条（去重合并后）
 */

import { defineFeature } from './spec-helpers'

export default defineFeature({
  id: 'F-1.1',
  title: '创建统一 ShortcutPanel 组件',
  epic: 'Epic 1: 快捷键面板统一',
  page: '[Canvas]',

  setup() {
    // TODO: 实现前由 Architect 提供 ShortcutHintPanel + ShortcutHelpPanel 的完整 SHORTCUTS 列表
    // 预期在 src/components/canvas/features/ShortcutPanel.tsx 创建
  },

  acceptanceCriteria: [
    {
      id: 'AC-1.1-1',
      description: 'ShortcutPanel 导出 SHORTCUTS 数组包含 ? 键',
      expect: `expect(shortcutPanelModule.SHORTCUTS.some(s => s.key === '?')).toBe(true)`,
    },
    {
      id: 'AC-1.1-2',
      description: 'ShortcutPanel SHORTCUTS 包含 Ctrl+G',
      expect: `expect(shortcutPanelModule.SHORTCUTS.some(s => s.key === 'Ctrl+G')).toBe(true)`,
    },
    {
      id: 'AC-1.1-3',
      description: 'ShortcutPanel 不同时渲染两个面板（单一数据源）',
      expect: `expect(screen.queryAllByTestId(/shortcut-panel/i)).toHaveLength(1)`,
    },
    {
      id: 'AC-1.1-4',
      description: '按 ? 键打开面板后再按 ? 关闭',
      expect: `await user.keyboard.press('?'); expect(screen.getByTestId('shortcut-panel')).toBeVisible(); await user.keyboard.press('?'); expect(screen.queryByTestId('shortcut-panel')).not.toBeVisible()`,
    },
  ],

  dod: [
    'features/ShortcutPanel.tsx 文件存在',
    'SHORTCUTS 数组导出且可被测试导入',
    'ShortcutHintPanel 和 ShortcutHelpPanel 不再被 CanvasPage 直接渲染',
    '合并后快捷键数量去重验证通过',
  ],
})
