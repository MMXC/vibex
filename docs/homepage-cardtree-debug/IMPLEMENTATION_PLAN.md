# Implementation Plan: homepage-cardtree-debug

**项目**: homepage-cardtree-debug
**Architect**: architect
**日期**: 2026-03-24
**状态**: ✅ 完成

---

## 1. Sprint 概览

| Phase | Epic | 工期 | 负责 |
|-------|------|------|--------|
| Phase 1 | Epic 1: 数据传递修复 | 1h | Dev |
| Phase 2 | Epic 2: 本地数据模式 | 2h | Dev |
| Phase 3 | Epic 3: UI 交互验证 | 2h | Dev |
| Phase 4 | Epic 4: 构建验证 | 1h | Tester |

**预计总工期**: 6 小时（1 天）

---

## 2. Phase 详细

### Phase 1 — Epic 1: 数据传递修复 (1h)

**任务**:
1. 修改 `HomePage.tsx`，传递 `useCardTree` 和 `projectId`
2. 确认 `useHomePage` 是否暴露 `createdProjectId`
3. 修改 `PreviewArea.tsx` 传递 `projectId` 到 `CardTreeView`

**验收标准**:
- [ ] `PreviewArea` 接收到正确的 `projectId` 和 `useCardTree`
- [ ] `CardTreeView` 在 `projectId` 存在时不显示 empty state

---

### Phase 2 — Epic 2: 本地数据模式 (2h)

**任务**:
1. 扩展 `useProjectTree` 支持 `localData` 参数
2. 实现 `boundedContexts → CardTreeNode[]` 转换函数
3. `CardTreeView` 根据 `localData` 是否存在选择本地/API 模式

**验收标准**:
- [ ] `useProjectTree({ localData })` 返回正确数据
- [ ] `boundedContexts` 正确映射为 `CardTreeNode[]`

---

### Phase 3 — Epic 3: UI 交互验证 (2h)

**任务**:
1. E2E 测试：CardTree 节点展开/收起
2. E2E 测试：复选框交互
3. 验证状态图标显示
4. 验证空状态处理

**验收标准**:
- [ ] 所有 UI 交互测试通过
- [ ] Mermaid 回退正常（useCardTree=false）

---

### Phase 4 — Epic 4: 构建验证 (1h)

**任务**:
1. `npm run build` 成功
2. 相关单元测试全绿
3. Playwright E2E 回归

**验收标准**:
- [ ] 构建退出码 0
- [ ] 测试无新增失败
- [ ] E2E 通过率 ≥ 90%

---

## 3. 验收检查清单

- [ ] HomePage → PreviewArea 传递 projectId
- [ ] PreviewArea → CardTreeView 传递 projectId
- [ ] useProjectTree 支持本地数据模式
- [ ] boundedContexts → CardTreeNode 转换正确
- [ ] CardTree 节点可展开/收起
- [ ] Mermaid 回退正常
- [ ] npm run build 成功

---

**实施计划完成**: 2026-03-24 01:53 (Asia/Shanghai)
