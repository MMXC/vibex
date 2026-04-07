# PRD: Reviewer Proposals — TypeScript 类型安全修复

**项目**: vibex-reviewer-proposals-vibex-proposals-20260410  
**日期**: 2026-04-10  
**负责人**: PM Agent  
**版本**: v1.0

---

## 执行摘要

### 背景

代码审查（Reviewer Agent, 2026-04-10）发现 **10 个 TypeScript 类型安全问题**，其中 P0×5，全部集中在 `as any` 类型断言绕过。核心根因：React Flow 节点类型缺失 + Zustand store middleware 泛型未定义。这些问题若不修复，将持续引入运行时错误风险，影响 DDD 可视化编辑器、预览页面等核心功能的稳定性。

### 目标

消除所有 `as any` 类型断言，建立完整的 TypeScript 类型体系，使 `tsc --noEmit` 零错误通过。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| `NodeProps<any>` 出现次数 | 0 |
| `StoreSlice<any>` 出现次数 | 0 |
| `as any as` 双重断言出现次数 | 0 |
| `any[]` 硬编码类型出现次数 | 0 |
| `tsc --noEmit` 错误数 | 0 |
| E2E 测试通过率 | 100% |

---

## Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|----------|------|
| F1 | React Flow 节点类型定义 | 定义 FlowNodeData、CardNodeData 接口，替换所有 NodeProps<any> | R-P0-1, R-P0-2 | 2.5h |
| F2 | Zustand Middleware 泛型修复 | 为所有 StoreSlice<any> 提供明确泛型参数 | R-P0-3 | 1h |
| F3 | API Schema 类型修复 | 定义 AIMessage 接口，替换 messages: any[] | R-P0-4 | 0.5h |
| F4 | 双重断言消除 | 将 `props as any as T` 替换为显式类型 | R-P1-1, R-P1-2 | 1.5h |
| **合计** | | | | **5.5h** |

---

## Epic 拆分

### Epic 1: React Flow 类型修复

**目标**: 为所有 React Flow 节点组件提供强类型支持，消除 `NodeProps<any>` 和 `useNodesState<any>`

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 定义 FlowNodeData/CardNodeData 接口 | 0.5h | `types/` 下存在 FlowNodeData 和 CardNodeData 接口定义，包含所有必要字段 |
| S1.2 | FlowNodes.tsx 替换 NodeProps<any> | 1h | `grep "NodeProps<any>" --include="*.tsx"` 返回 0 结果 |
| S1.3 | DomainPageContent useNodesState 泛型 | 0.5h | `grep "useNodesState<any>" --include="*.tsx"` 返回 0 结果 |
| S1.4 | preview/page.tsx map 回调类型 | 0.5h | 无 `(ctx: any)` 或 `(model: any)` 断言 |

**验收标准**:
```
expect(source code).not.toMatch(/NodeProps<any>/)
expect(source code).not.toMatch(/useNodesState<any>/)
expect(tsc --noEmit).toHaveErrors(0)
```

---

### Epic 2: Zustand Middleware 泛型修复

**目标**: 为所有 StoreSlice 定义明确的泛型约束，消除隐式 any

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | middleware.ts StoreSlice<any> 替换 | 1h | `grep "StoreSlice<any>" --include="*.ts"` 返回 0 结果 |

**验收标准**:
```
expect(source code).not.toMatch(/StoreSlice<any>/)
expect(tsc --noEmit).toHaveErrors(0)
```

---

### Epic 3: API Schema 类型修复

**目标**: 为 UI schema API 响应建立完整类型，消除 any[] 硬编码

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | ui-schema.ts messages 类型定义 | 0.5h | 定义 AIMessage 接口，`grep "any\[\]" --include="*.ts"` 返回 0 结果 |

**验收标准**:
```
expect(source code).toMatch(/interface AIMessage/)
expect(source code).not.toMatch(/: any\[\]/)
expect(tsc --noEmit).toHaveErrors(0)
```

---

### Epic 4: 双重断言消除

**目标**: 消除所有 `as any as` 双重断言，替换为类型安全的显式类型

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | props as any as 替换为显式类型 | 1.5h | `grep "as any as" --include="*.tsx"` 返回 0 结果 |

**验收标准**:
```
expect(source code).not.toMatch(/as any as/)
expect(source code).not.toMatch(/CardTreeRenderer.*as any/)
expect(tsc --noEmit).toHaveErrors(0)
```

---

## 验收标准（完整）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 修复完成后 | `grep "NodeProps<any>" --include="*.tsx"` | 0 结果 |
| AC2 | 修复完成后 | `grep "StoreSlice<any>" --include="*.ts"` | 0 结果 |
| AC3 | 修复完成后 | `grep "as any as" --include="*.tsx"` | 0 结果 |
| AC4 | 修复完成后 | `grep ": any\[\]" --include="*.ts"` | 0 结果 |
| AC5 | 修复完成后 | `tsc --noEmit` | 0 类型错误 |
| AC6 | 修复完成后 | E2E 测试套件运行 | 全部通过 |

---

## DoD（Definition of Done）

- [ ] 所有 `as any` 类型断言已消除
- [ ] `tsc --noEmit` 零错误通过
- [ ] 类型接口已正确定义在 `types/` 目录或相关模块内
- [ ] 未破坏任何现有组件功能
- [ ] E2E 测试全部通过
- [ ] PR 已创建并通过 Code Review

---

## 功能点汇总表（含页面集成标注）

| 功能点 | 文件位置 | 页面/模块 | 影响范围 |
|--------|----------|-----------|----------|
| F1.1 FlowNodeData 接口 | `src/types/` (新建) | DDD 编辑器、Flow 可视化 | React Flow 所有节点组件 |
| F1.2 FlowNodes.tsx 类型修复 | `components/ui/FlowNodes.tsx` | Flow 可视化页面 | Flow 节点渲染 |
| F1.3 DomainPageContent 类型修复 | `components/domain/DomainPageContent.tsx` | DDD 编辑器 | 节点状态管理 |
| F1.4 preview/page.tsx 类型修复 | `app/preview/page.tsx` | 预览页面 | 上下文/模型渲染 |
| F2.1 StoreSlice 泛型修复 | `stores/ddd/middleware.ts` | DDD store | Zustand middleware |
| F3.1 AIMessage 接口 | `types/ui-schema.ts` (新建) | UI Schema API | 消息类型 |
| F4.1 双重断言消除 | CardTreeNode.tsx, PageNode.tsx, FlowNodes.tsx, CardTreeRenderer.tsx | Flow 可视化页面 | 多节点类型传递链 |

---

## 实施计划（Sprint 排期）

| Sprint | 日期 | Epic | Story | 工时 | 交付物 |
|--------|------|------|-------|------|--------|
| Sprint 1 | 2026-04-10 | E1 React Flow 类型修复 | S1.1 类型接口定义 | 0.5h | FlowNodeData, CardNodeData 接口 |
| Sprint 1 | 2026-04-10 | E1 React Flow 类型修复 | S1.2 FlowNodes.tsx | 1h | 无 NodeProps<any> 的 FlowNodes.tsx |
| Sprint 1 | 2026-04-10 | E1 React Flow 类型修复 | S1.3 + S1.4 | 1h | useNodesState 和 preview 修复 |
| Sprint 2 | 2026-04-11 | E2 Middleware | S2.1 StoreSlice 修复 | 1h | 无 StoreSlice<any> 的 middleware.ts |
| Sprint 2 | 2026-04-11 | E3 API Schema | S3.1 AIMessage 接口 | 0.5h | 类型安全的 UI schema |
| Sprint 2 | 2026-04-11 | E4 双重断言消除 | S4.1 双重断言替换 | 1.5h | 无 `as any as` 的所有组件 |
| Sprint 2 | 2026-04-11 | — | 集成验证 | — | `tsc --noEmit` + E2E |
| **合计** | | | | **5.5h** | |

---

## 技术方案

### 推荐方案：渐进式修复

按优先级逐文件修复，不破坏现有功能，风险可控。

**修复顺序**:
1. **Phase 1** — 定义核心类型接口（E1-S1.1, E3-S3.1）
2. **Phase 2** — 修复 React Flow 组件（E1-S1.2, S1.3, S1.4）
3. **Phase 3** — 修复 Zustand middleware（E2-S2.1）
4. **Phase 4** — 消除双重断言（E4-S4.1）
5. **Phase 5** — 集成验证（tsc + E2E）

**风险缓解**:
- 使用 `as unknown as T` 作为安全过渡模式
- 每个文件修复后立即运行 `tsc --noEmit` 验证
- E2E 测试作为最终回归验证

---

## 风险矩阵

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 类型修复破坏现有组件 | 🟡 中 | 保留 `as unknown as T` 过渡，修复后立即 tsc 验证 |
| React Flow 类型定义不完整 | 🟡 中 | 先定义核心字段，逐步完善 |
| 破坏已通过的 E2E 测试 | 🟢 低 | 修复后运行完整 E2E 验证 |
| 双重断言消除涉及多个文件 | 🟢 低 | 按文件逐个修复，每次验证 |

---

*文档版本: v1.0 | 2026-04-10*
