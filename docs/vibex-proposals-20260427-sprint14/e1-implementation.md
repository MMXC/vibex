# E1 Design-to-Code Pipeline — Implementation Plan

## 现状分析（Codebase Inventory）

| 组件 | 状态 | 路径 |
|------|------|------|
| CodeGenPanel + CSS Module | ✅ 已有 (E10) | `src/components/CodeGenPanel/` |
| codeGenerator.ts | ✅ 已有 (E10) | `src/lib/codeGenerator.ts` |
| codeGenerator.test.ts | ✅ 已有 | `src/__tests__/codeGenerator.test.ts` |
| featureFlags.ts | ✅ 已有 | `src/lib/featureFlags.ts` |
| figma-import.ts | ✅ 已有 | `src/services/figma/figma-import.ts` |
| agentStore | ✅ 已有 | `src/stores/agentStore.ts` |
| CodingAgentService | ✅ 已有 | `src/services/agent/CodingAgentService.ts` |
| DesignNode type | ❌ 缺失 | 需定义 |
| CodeGenContext type | ❌ 缺失 | 需定义 |
| injectContext() | ❌ 缺失 | 需在 agentStore 添加 |
| DesignTokenService | ❌ 缺失 | 需新建 |
| Template Engine | ❌ 缺失 | 需新建（Handlebars）|
| Bidirectional Sync | ❌ 缺失 | 需新建（flag gated）|
| Batch Export | ❌ 缺失 | 需新建 |

## 任务分解（5 Units → 按依赖排序）

### E1-U1: Feature Flag + Type Definitions + injectContext
**依赖**: 无 | **优先级**: 1

- [ ] `featureFlags.ts` 添加 `FEATURE_DESIGN_TO_CODE_PIPELINE` (default false)
- [ ] `src/types/codegen.ts` 定义 `CodeGenContext` / `DesignNode` 类型
- [ ] `agentStore` 添加 `injectContext(context: CodeGenContext)` 方法，含形状验证，非法输入 throw
- [ ] `FEATURE_DESIGN_TO_CODE_BIDIRECTIONAL` flag 注册
- [ ] 单元测试覆盖 injectContext 验证逻辑

### E1-U2: Figma Token Extraction + DesignTokenService
**依赖**: U1 | **优先级**: 2

- [ ] `src/services/design-token/DesignTokenService.ts`
  - 解析 Figma token nodes → internal token schema
  - 200 节点上限截断（阈值可配置）
  - 截断时 warn 不 error
- [ ] `src/types/design.ts` 添加 `DesignNode` / `DesignToken` / `TokenSnapshot` 类型
- [ ] `src/lib/design-token/validation.ts` token 结构验证
- [ ] 单元测试

### E1-U3: Template Engine + Format Renderers
**依赖**: U2 | **优先级**: 3

- [ ] `src/lib/design-token/templates/` — Handlebars 模板（CSS / Tailwind / JS constants）
- [ ] `src/lib/design-token/renderers/` — 渲染器（JSON / CSS / SCSS / JS）
- [ ] 版本 hash 嵌入输出
- [ ] 各格式 schema 验证
- [ ] 单元测试

### E1-U4: Bidirectional Sync（Feature Flag Gated）
**依赖**: U3 | **优先级**: 4

- [ ] `FEATURE_DESIGN_TO_CODE_BIDIRECTIONAL` flag check
- [ ] Drift detection（schemaVersion hash 比对）
- [ ] 3-way merge conflict resolution
- [ ] `src/components/ConflictResolutionDialog/` — ConflictResolutionDialog UI
- [ ] 单元测试 + E2E 测试

### E1-U5: Batch Export
**依赖**: U3 | **优先级**: 5

- [ ] 批量导出 job queue（后台）
- [ ] 支持多 token sets 批量导出
- [ ] data-testid 标注

### E1-U6: Export Format Variants（扩展现有 codeGenerator）
**依赖**: U3 | **优先级**: 6

- [ ] codeGenerator.ts 扩展支持 SCSS / JS export
- [ ] 各格式 schema 验证

## 验收标准

- [ ] `pnpm tsc --noEmit` 通过
- [ ] `pnpm lint` zero errors
- [ ] 所有新组件含 `data-testid`
- [ ] injectContext() 对无效输入 throw
- [ ] 节点截断 warn 不 error
- [ ] Commit message 包含 E1 标识

## 实施顺序

```
U1 → U2 → U3 → U4 (flag gated)
                   ↘ U5
                   ↘ U6
```

## 回滚计划

如遇阻塞，回退到 E10 已验证的 codeGenerator.ts，保留 CodeGenPanel 正常工作。
