// F-4.1: canvasSseApi Snapshot Test
// Epic 4 | SSE 类型验证

/**
 * 目标: 为 canvasSseApi.ts 的 8 个 SSE Event 类型编写 snapshot test
 *
 * 类型列表:
 * 1. ThinkingEvent
 * 2. BoundedContext
 * 3. StepContextEvent
 * 4. StepModelEvent
 * 5. StepFlowEvent
 * 6. StepComponentsEvent
 * 7. DoneEvent
 * 8. ErrorEvent
 */

import { defineFeature } from './spec-helpers'

const SSE_EVENT_TYPES = [
  'ThinkingEvent',
  'BoundedContext',
  'StepContextEvent',
  'StepModelEvent',
  'StepFlowEvent',
  'StepComponentsEvent',
  'DoneEvent',
  'ErrorEvent',
]

export default defineFeature({
  id: 'F-4.1',
  title: 'canvasSseApi SSE 类型 Snapshot Test',
  epic: 'Epic 4: SSE 类型验证',
  page: '无（单元测试）',

  acceptanceCriteria: SSE_EVENT_TYPES.map((typeName, i) => ({
    id: `AC-4.1-${i + 1}`,
    description: `${typeName} 类型有 snapshot test`,
    expect: `expect(snapshotTestFile).toMatch(new RegExp('test.*${typeName}'))`,
  })).concat([
    {
      id: 'AC-4.1-9',
      description: '__snapshots__/canvasSseApi.snapshot.test.ts.snap 文件存在',
      expect: `expect(fs.existsSync('__snapshots__/canvasSseApi.snapshot.test.ts.snap')).toBe(true)`,
    },
    {
      id: 'AC-4.1-10',
      description: 'snapshot 文件包含所有 8 个类型的快照',
      expect: `const snapshotKeys = Object.keys(snapshotFile); SSE_EVENT_TYPES.forEach(t => expect(snapshotKeys).toContain(t))`,
    },
  ]),

  dod: [
    'canvasSseApi.snapshot.test.ts 存在',
    '覆盖全部 8 个 SSE Event 类型',
    '__snapshots__/canvasSseApi.snapshot.test.ts.snap 已提交',
    'vitest run 通过',
  ],
})
