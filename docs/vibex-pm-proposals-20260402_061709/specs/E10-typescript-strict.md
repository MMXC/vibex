# Epic 10: TypeScript Strict 模式 + 类型统一 — Spec

**Epic ID**: E10
**优先级**: P2
**工时**: 4h
**页面集成**: tsconfig.json / types/canvas.ts / 全局

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E10-S1 | 修复 9 个 TS 预存错误 | 逐一修复当前 TS 编译错误 | `expect(tscErrors).toBe(0)` | 全局 |
| E10-S2 | 创建 types/canvas.ts 统一类型 | 建立 Canvas 领域统一类型定义文件 | 文件存在且包含 Context / Flow / Component / UIState 类型 | src/types/canvas.ts |
| E10-S3 | 渐进启用 TypeScript strict | 分阶段引入：`@typescript-eslint/no-explicit-any` warn → error → strict | `expect(tscStrictErrors).toBeLessThan(currentErrors)` | tsconfig.json / eslint |

---

## 详细验收条件

### E10-S1: 修复 9 个 TS 预存错误

- [ ] `tsc --noEmit` 0 错误（修复前 9 个）
- [ ] 常见错误类型修复：类型断言 / 缺少 null 检查 / 未使用变量
- [ ] 不引入 `as any` 作为临时修复

### E10-S2: 创建 types/canvas.ts

- [ ] 文件路径：`src/types/canvas.ts`
- [ ] 包含类型：
  ```typescript
  type ContextId = string;
  type FlowId = string;
  type ComponentId = string;
  interface Context { id: ContextId; name: string; state: NodeState; }
  interface Flow { id: FlowId; name: string; nodes: FlowNode[]; }
  interface Component { id: ComponentId; name: string; tree: ComponentNode; }
  interface UIState { scrollTop: number; activeTab: TabId; drawerOpen: boolean; }
  ```
- [ ] 所有 canvas 相关类型从此文件导出
- [ ] `expect(getExportedTypes('types/canvas.ts')).toContain('Context')`

### E10-S3: 渐进启用 TypeScript strict

- [ ] 阶段 1：`@typescript-eslint/no-explicit-any` 从 warn 升为 error
- [ ] 阶段 2：修复所有 explicit any 错误
- [ ] 阶段 3：启用 `strict: true`（允许渐进消除）
- [ ] 每阶段 `tsc --strict` 错误数递减
- [ ] `expect(tscStrictErrors).toBeLessThan(previousErrors)`

---

## 实现注意事项

1. **不引入 any**：修复过程中禁止使用 `as any` 临时绕过
2. **渐进迁移**：strict 模式分阶段引入，每阶段确保 CI 绿色
3. **类型统一**：所有新代码必须从 `types/canvas.ts` import 类型
