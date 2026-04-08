// F-1.3: 旧组件过渡期标记
// Epic 1 | 快捷键面板统一

/**
 * 目标: ShortcutHintPanel.tsx 和 ShortcutHelpPanel.tsx 改为 re-export 新组件 + @deprecated
 * 过渡期保留，向后兼容
 */

import { defineFeature } from './spec-helpers'

export default defineFeature({
  id: 'F-1.3',
  title: '旧组件过渡期 re-export + @deprecated',
  epic: 'Epic 1: 快捷键面板统一',
  page: '无（API 层）',

  acceptanceCriteria: [
    {
      id: 'AC-1.3-1',
      description: 'ShortcutHintPanel.tsx 有 @deprecated 注释',
      expect: `expect(shortcutHintPanelSource).toMatch(/@deprecated/)`,
    },
    {
      id: 'AC-1.3-2',
      description: 'ShortcutHelpPanel.tsx 有 @deprecated 注释',
      expect: `expect(shortcutHelpPanelSource).toMatch(/@deprecated/)`,
    },
    {
      id: 'AC-1.3-3',
      description: '两个旧组件都 re-export ShortcutPanel',
      expect: `expect(shortcutHintPanelSource).toMatch(/export.*ShortcutPanel/)`,
    },
    {
      id: 'AC-1.3-4',
      description: '@deprecated 注释数量 >= 导出数量（每个导出都标记）',
      expect: `const exportCount = (src.match(/^export/gm) || []).length; const deprecCount = (src.match(/@deprecated/g) || []).length; expect(deprecCount).toBeGreaterThanOrEqual(exportCount)`,
    },
  ],

  dod: [
    'ShortcutHintPanel.tsx 是 re-export + @deprecated',
    'ShortcutHelpPanel.tsx 是 re-export + @deprecated',
    '两个旧文件行数 < 10（只是桥接文件）',
    '已有代码引用旧组件仍然工作（re-export 保证向后兼容）',
  ],
})
