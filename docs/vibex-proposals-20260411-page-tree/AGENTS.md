# AGENTS.md: 组件树 flowId 匹配修复

**项目**: vibex-proposals-20260411-page-tree

---

## 开发约束

### 约束 1: 不得破坏通用组件分组
- [ ] modal/button 类型组件必须归入"通用组件"
- [ ] COMMON_FLOW_IDS 集合不得移除任何值

### 约束 2: AI prompt 不得强制使用特定 nodeId
- AI 应从可用 nodeId 列表中选择，不应硬编码
- 通用组件必须用 'common' flowId

### 约束 3: matchFlowNode 不得降低精确匹配优先级
- 精确匹配必须优先于 prefix 匹配
- prefix 匹配必须优先于名称匹配

---

## 验收检查清单

- [x] AI prompt 包含 flowId 填充指令
- [x] matchFlowNode 单元测试覆盖率 ≥ 80%
- [x] 通用组件（modal/button）分组正确
- [x] `npx vitest run ComponentTreeGrouping.test.ts` 35 tests 100% 通过
- [x] 无新增 TypeScript 错误

**验证命令**: `npx vitest run src/__tests__/canvas/ComponentTreeGrouping.test.ts`
**验证结果**: 35 tests passed (inferIsCommon: 14, matchFlowNode: 12, 其他: 9)
**Commit**: 无需新 commit (所有实现已完成，E1-E2 已合并)
