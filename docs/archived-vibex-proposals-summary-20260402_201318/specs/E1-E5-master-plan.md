# Spec: Proposals Summary E1-E5 Master Plan

## 1. 概述

**工时**: 34.5-38.5h + 6-9 人天
**优先级**: P0-P2
**来源**: Dev + PM + Architect 六方提案综合

## 2. Sprint 依赖图

```
Sprint 0 (E1): D-001 + D-002 → 解除 CI 阻断
    ↓
Sprint 1 (E2): D-E1 + D-E2 + D-004 + P-001 + P-002 → 用户可感知改进
    ↓
Sprint 2 (E3): D-003 + P-003 + D-005 + D-007 → 关键路径
    ↓
Sprint 3 (E4): D-006 + P-004 + P-006 → 体验 + 质量
    ↓
Sprint 4 (E5): P-005 → 移动端降级
```

## 3. E1 详细规格 (Sprint 0)

### D-001: TS 错误清理
```bash
cd vibex-fronted && npm run build 2>&1 | grep "error TS"
# 分类处理：废弃API / 类型缺失 / 路径别名
```

### D-002: DOMPurify Override
```json
// package.json
"overrides": {
  "monaco-editor": { "dompurify": "3.3.3" }
}
```

## 4. E2 详细规格 (Sprint 1)

### D-E1: BoundedContextTree 合并 checkbox
- 删除 `selectionCheckbox`（绝对定位）
- 保留 1 个 inline checkbox
- 文件: `BoundedContextTree.tsx`

### D-E2: FlowCard 级联确认
- `confirmFlowNode` 增加 steps 级联
- 文件: `canvasStore.ts` line 837

### P-001: 确认状态可视化
- 未确认: `border: 2px dashed var(--color-warning)`
- 已确认: `border: 2px solid var(--color-success)`
- 工具栏增加筛选: 全部 / 已确认 / 待确认

### D-004: Migration 2→3 修复
```ts
status: confirmed ? 'confirmed' : (rest.status ?? 'pending'),
```

### P-002: 面板状态持久化
```ts
const PANEL_STATE_KEY = 'vibex-panel-collapsed-state';
// 值: { left: boolean, right: boolean, bottom: boolean }
```

## 5. E3 详细规格 (Sprint 2)

### D-003 Phase1: CanvasStore 拆分
```
canvasStore (入口 < 300行)
├── contextStore      // ~180行
├── flowStore       // ~350行
├── componentStore  // ~180行
└── uiStore        // ~280行
```

### P-003: 导出向导
1. Step 1: 选择导出格式（Markdown / JSON / 代码）
2. Step 2: 填写元信息（项目名称、描述、作者）
3. Step 3: 确认预览 → 导出

### D-005: API 防御性解析
```ts
const type = validTypes.includes(comp.type) ? comp.type : 'page';
const method = validMethods.includes(comp.api?.method) ? comp.api.method : 'GET';
```

### D-007: vitest 配置
```js
{
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: { '@': '/src' },
  },
}
```

## 6. E4 详细规格 (Sprint 3)

### P-004: 空状态引导
```tsx
{!hasData && (
  <GuideCard>
    <h3>开始使用 VibeX</h3>
    <QuickActions>
      <Button icon="add-context">新建上下文</Button>
      <Button icon="import">导入数据</Button>
    </QuickActions>
  </GuideCard>
)}
```

### D-006: E2E 测试文件
- `journey-create-context.spec.ts`
- `journey-generate-flow.spec.ts`
- `journey-multi-select.spec.ts`

### P-006: Markdown 导出结构
```markdown
# {项目名称}
## 限界上下文
## 业务流程
## 组件清单
```

## 7. E5 详细规格 (Sprint 4)

### P-005: 移动端降级
```ts
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
```

## 8. DoD

- [ ] E1: TS error = 0, DOMPurify override 生效
- [ ] E2: 1 checkbox, 级联 confirmed, 黄/绿边框, Migration 正确, 面板持久化
- [ ] E3: contextStore ≤200 行, 3步向导, ZodError = 0, 测试 < 60s
- [ ] E4: 引导卡片, E2E > 60%, Markdown 导出
- [ ] E5: 移动检测, 降级提示, 只读预览
