// F-3.1 + F-3.2 + F-3.3: dddApi 废弃路径
// Epic 3 | dddApi 废弃路径

/**
 * F-3.1: dddApi.ts 每个导出加 @deprecated 注解
 * F-3.2: 编写 dddApi → canvasSseApi 迁移文档
 * F-3.3: CI lint 规则禁止新增 dddApi 引用
 */

import { defineFeature } from './spec-helpers'
import * as fs from 'fs'
import * as path from 'path'

export default defineFeature({
  id: 'F-3.1',
  title: 'dddApi @deprecated 注解',
  epic: 'Epic 3: dddApi 废弃路径',
  page: '无（API 层）',

  setup() {
    const dddApiPath = 'vibex-fronted/src/lib/canvas/api/dddApi.ts'
    const source = fs.readFileSync(dddApiPath, 'utf-8')
    return { source, dddApiPath }
  },

  acceptanceCriteria: [
    {
      id: 'AC-3.1-1',
      description: 'dddApi.ts 文件头部有 @deprecated 说明',
      expect: `expect(source).toMatch(/@deprecated/)`,
    },
    {
      id: 'AC-3.1-2',
      description: '每个 export 语句上方有 @deprecated 注解',
      // 统计 export 和 @deprecated 数量关系
      expect: `const exports = source.match(/^export\\s/gm)?.length || 0; const deprecs = source.match(/@deprecated/g)?.length || 0; expect(deprecs).toBeGreaterThanOrEqual(exports)`,
    },
    {
      id: 'AC-3.1-3',
      description: '@deprecated 注解包含迁移目标（如 use canvasSseAnalyze from canvasSseApi）',
      expect: `expect(source).toMatch(/@deprecated[\\s\\S]*?canvasSseApi/)`,
    },
  ],

  dod: [
    'dddApi.ts 每个 export 函数/类型上方都有 @deprecated',
    '@deprecated 注解指明了迁移目标（canvasSseApi）',
    'grep -A1 "@deprecated" dddApi.ts 输出版本化',
  ],
})

// F-3.2: 迁移文档
export const f32Spec = defineFeature({
  id: 'F-3.2',
  title: 'dddApi 迁移文档',
  epic: 'Epic 3: dddApi 废弃路径',
  page: '无（文档）',

  acceptanceCriteria: [
    {
      id: 'AC-3.2-1',
      description: '迁移文档存在',
      expect: `expect(fs.existsSync('docs/vibex-canvas-analysis/dddApi-migration.md')).toBe(true)`,
    },
    {
      id: 'AC-3.2-2',
      description: '文档包含 services/api/modules/ddd.ts 的迁改步骤',
      expect: `expect(doc).toMatch(/services\\/api\\/modules\\/ddd/); expect(doc).toMatch(/canvasSseApi/)`,
    },
    {
      id: 'AC-3.2-3',
      description: '文档包含 ai-client.ts 的迁改步骤',
      expect: `expect(doc).toMatch(/ai-client/); expect(doc).toMatch(/canvasSseAnalyze/)`,
    },
    {
      id: 'AC-3.2-4',
      description: '文档包含 homepage/hooks/useHomeGeneration.ts 的迁改步骤',
      expect: `expect(doc).toMatch(/useHomeGeneration/); expect(doc).toMatch(/canvasSseApi/)`,
    },
  ],

  dod: [
    'docs/vibex-canvas-analysis/dddApi-migration.md 存在',
    '包含所有 3 个消费者的迁移步骤',
    '迁移步骤可执行（替换 import 路径即可）',
  ],
})

// F-3.3: CI lint 规则
export const f33Spec = defineFeature({
  id: 'F-3.3',
  title: 'CI lint 禁止 dddApi 引用',
  epic: 'Epic 3: dddApi 废弃路径',
  page: '无（CI）',

  acceptanceCriteria: [
    {
      id: 'AC-3.3-1',
      description: 'ESLint/TypeScript 规则已添加 dddApi 限制',
      expect: `expect(eslintConfig).toMatch(/canvas-api.*\\bdddApi\\b.*deny|disallow/)`,
    },
    {
      id: 'AC-3.3-2',
      description: '在测试文件中引入 dddApi 会触发 lint 错误（生产代码限制，不限制测试）',
      expect: `// 生产代码引入 dddApi 时 lint 报错；测试文件允许（向后兼容）`,
    },
  ],

  dod: [
    'lint 配置文件已更新',
    '新引入 dddApi 的生产代码 lint 报错',
    '文档说明测试文件豁免规则',
  ],
})
