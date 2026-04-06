# AGENTS.md: VibeX TypeScript Type Safety 2026-04-10

> **项目**: vibex-reviewer-proposals-vibex-proposals-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. 角色定义

| 角色 | 负责人 | 职责范围 |
|------|--------|----------|
| **Dev** | @dev | 类型修复实现 |
| **Reviewer** | @reviewer | PR 审查 |
| **Architect** | @architect | 架构设计 |

---

## 2. Dev Agent 职责

### 2.1 任务分配

| Task | 描述 | 工时 | 产出 |
|------|------|------|------|
| S1.1 | 创建类型定义文件 | 0.5h | `types/flow.ts` |
| S1.2 | FlowNodes.tsx 修复 | 1h | `components/FlowNodes.tsx` |
| S1.3 | DomainPageContent 修复 | 0.5h | `pages/domain/...tsx` |
| S1.4 | preview/page.tsx 修复 | 0.5h | `pages/preview/page.tsx` |
| S2.1 | StoreSlice 泛型修复 | 1h | `types/store.ts`, `stores/middleware.ts` |
| S3.1 | AIMessage 类型定义 | 0.5h | `types/api.ts` |
| S4.1 | as any as 消除 | 1.5h | 相关组件 |

### 2.2 提交规范

```bash
# 格式: fix(type): <description>
git commit -m "fix(type): S1.1 add FlowNodeData and CardNodeData interfaces"
git commit -m "fix(type): S1.2 replace NodeProps<any> in FlowNodes.tsx"
git commit -m "fix(type): S1.3 add generic to useNodesState in DomainPageContent"
git commit -m "fix(type): S1.4 fix domain context types in preview"
git commit -m "fix(type): S2.1 add StoreSlice<T> generic constraint"
git commit -m "fix(type): S3.1 define AIMessage interface"
git commit -m "fix(type): S4.1 eliminate as any as double assertions"
```

### 2.3 禁止事项

| 禁止模式 | 正确替代 |
|---------|---------|
| `NodeProps<any>` | `NodeProps<FlowNodeData>` |
| `StoreSlice<any>` | `StoreSlice<StoreActions, StoreState>` |
| `as any as` | 显式类型接口 |
| `messages: any[]` | `messages: AIMessage[]` |
| `ctx: any` | 具体接口类型 |

---

## 3. Reviewer Agent 职责

### 3.1 PR 审查清单

```bash
# T-01: 无 NodeProps<any>
grep -rn "NodeProps<any>" vibex-fronted/src/ --include="*.tsx" | wc -l
# 应输出: 0

# T-02: 无 StoreSlice<any>
grep -rn "StoreSlice<any>" vibex-fronted/src/ --include="*.ts" | wc -l
# 应输出: 0

# T-03: 无 as any as
grep -rn "as any as" vibex-fronted/src/ --include="*.tsx" | wc -l
# 应输出: 0

# T-04: 无 any[]
grep -rn ": any\[\]" vibex-fronted/src/ --include="*.ts" | wc -l
# 应输出: 0

# T-05: tsc 通过
cd vibex-fronted && pnpm exec tsc --noEmit
# 应 0 errors
```

### 3.2 驳回条件

1. PR 引入新的 `any` 类型
2. PR 引入新的 `as any as`
3. `tsc --noEmit` 有错误
4. 类型定义不完整

---

## 4. Definition of Done

### Sprint DoD

- [ ] `NodeProps<any>` → 0 结果
- [ ] `StoreSlice<any>` → 0 结果
- [ ] `as any as` → 0 结果
- [ ] `: any[]` → 0 结果
- [ ] `tsc --noEmit` → 0 errors
- [ ] E2E 测试全部通过

---

## 5. 文件清单

| 文件 | 路径 | 负责人 |
|------|------|--------|
| flow.ts | `vibex-fronted/src/types/` | Dev |
| store.ts | `vibex-fronted/src/types/` | Dev |
| api.ts | `vibex-fronted/src/types/` | Dev |
| FlowNodes.tsx | `vibex-fronted/src/components/` | Dev |
| DomainPageContent | `vibex-fronted/src/pages/domain/` | Dev |
| preview/page.tsx | `vibex-fronted/src/pages/preview/` | Dev |
| middleware.ts | `vibex-fronted/src/stores/` | Dev |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
