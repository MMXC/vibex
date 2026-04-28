# VibeX Sprint 15 QA — AGENTS.md (开发约束)

**Agent**: architect
**Date**: 2026-04-28
**Project**: vibex-proposals-20260428-sprint15-qa

---

## 1. 角色职责

| Role | 职责 |
|------|------|
| Dev | **立即处理 P006-U1 BLOCKER**：9 个 ESLint NEEDS FIX 文件 |
| Tester | 验证 27 个验收标准，补充 P001/P005 端到端 gstack /qa |
| Reviewer | 验证 P006 BLOCKER 解除 + CHANGELOG 更新 |

---

## 2. Epic 技术约束

### P001: AI Coding Agent 真实集成

**Dev 约束**:
- `/api/v1/agent/generate` 端点必须存在且返回非 404
- `agentStore.injectContext()` 必须支持 idle/loading/success/error 状态切换
- API error 时必须 graceful degradation（显示错误提示，不崩溃）

**Tester 约束**:
- 验证 `pnpm exec tsc --noEmit` exit 0
- **⚠️ 需补充真实端到端验证**：tester 报告当前为模板，无真实 gstack /qa 结果

**Reviewer 约束**:
- 检查 CodeGenPanel 在 DDSCanvasPage 正确渲染
- 检查 agentStore 状态机正确

---

### P003: BPMN Export

**Dev 约束**:
- `bpmn-js` + `bpmn-moddle` 必须 dynamic import（禁止顶层 import）
- `exportFlowToBpmn()` Phase 1 限定 4 种元素：StartEvent / EndEvent / ServiceTask / SequenceFlow
- FlowTab 必须有 `data-testid="bpmn-export-btn"`
- 导出失败必须展示用户可见错误提示（不得静默失败）

**Tester 约束**:
- 验证 11 个单元测试全部通过
- 验证导出的 BPMN XML 包含 4 种元素标签
- **⚠️ 需补充 E2E**：无 BPMN 下载流程的 E2E 测试

**Reviewer 约束**:
- 检查 bpmn-js bundle 不影响首屏加载（动态 import）
- 检查 BPMN XML 输出符合 BPMN 2.0 schema

---

### P004: Version Compare UI

**Dev 约束**:
- SnapshotSelector 必须支持任意两个快照对比（不限最新两个）
- Diff 高亮颜色必须符合规范：added #22c55e / removed #ef4444 / modified #eab308
- 还原操作前必须强制创建 backup snapshot（`confirmationStore.addCustomSnapshot()`）
- 还原按钮 disabled 状态必须正确处理

**Tester 约束**:
- 验证 5 个单元测试全部通过
- 验证 backup snapshot 在还原前创建
- **⚠️ 需补充 E2E**：无 version compare + restore 完整流程的 E2E 测试

**Reviewer 约束**:
- 检查版本还原是可逆操作（backup 机制）
- 检查 diff 高亮颜色符合设计规范

---

### P005: MCP Server Integration

**Dev 约束**:
- 5 个 MCP tools 必须注册到 `execute.ts`
- `/api/delivery/snapshots` REST API 必须支持 GET/POST/DELETE
- Claude Desktop setup 文档必须存在且可执行

**Tester 约束**:
- 验证 snapshotStore + confirmationStore tests 通过
- 验证 mcp-server `tsc --noEmit` exit 0
- **⚠️ 需真实 MCP environment 验证**：当前仅验证 unit test

**Reviewer 约束**:
- 检查 MCP 工具声明与实现一致
- 检查 CHANGELOG 包含 P005 entry

---

### P006: Tech Debt Cleanup 🔴 BLOCKER

**Dev 约束**:
- **🔴 BLOCKER**: P006-U1 未完成前 U2~U4 全部阻塞
- 修复 `src/stores/ddd/init.ts` 动态 `require('react')` → 顶层 import
- 修复 `src/lib/canvas/search/SearchIndex.ts` 动态 require zustand → 工厂函数
- 修复 `src/components/chat/SearchFilter.tsx` 未使用参数 → `_` 前缀或删除
- 修复 `src/hooks/canvas/useCanvasExport.ts` 未使用类型导入 → 删除
- 修复 `src/types/api-generated.ts` 空接口 → 补充或删除
- 废弃目录删除前必须确认无 import 引用（`grep -r` 验证）
- 每次修改后必须运行 `vitest run` 确认无回归

**Tester 约束**:
- 验证 P006-U1: `grep "NEEDS FIX" ESLINT_DISABLES.md` 返回 0
- 验证 P006-U2: `npm run lint` exit 0 + `tsc --noEmit` exit 0
- 验证 P006-U3: 废弃目录不存在
- 验证 P006-U4: `vitest run` 全部通过

**Reviewer 约束**:
- 检查 ESLint NEEDS FIX 条目确实清零
- 检查废弃目录删除不引入新 import 错误
- 检查 CHANGELOG 包含 P006 entry

---

## 3. 已知风险与处置

| Risk | 级别 | 处置 |
|------|------|------|
| P006 U1 BLOCKER（ESLint NEEDS FIX 未清零）| 🔴 BLOCKER | Dev 立即处理 9 个 NEEDS FIX 文件 |
| P001 无真实端到端验证 | 🟠 中 | 下次 sprint 补充 gstack /qa |
| P005 MCP 真实配置未验证 | 🟠 中 | unit test 覆盖工具逻辑 |
| P003 BPMN 下载无 E2E | 🟡 轻微 | 下次 sprint 补充 |
| P004 无 E2E 测试 | 🟡 轻微 | unit test 覆盖 5 cases |
| P003 测试接口不稳定（已修复）| 🟡 轻微 | `52b3bf64b` 修复 mock + escaped XML |

---

## 4. P006 BLOCKER 修复路径

### 立即行动（U1）

修复 5 个文件的 ESLint NEEDS FIX：

```
1. src/stores/ddd/init.ts
   动态 require('react') → 顶层 import

2. src/lib/canvas/search/SearchIndex.ts
   动态 require zustand → 工厂函数或静态 import

3. src/components/chat/SearchFilter.tsx:120
   未使用参数 maxPreviewResults → 加 `_` 前缀

4. src/hooks/canvas/useCanvasExport.ts:18
   未使用类型导入 → 删除

5. src/types/api-generated.ts:11
   空接口 placeholder → 补充接口字段或删除文件
```

### U1 完成后自动解锁

```
U1 完成 (NEEDS FIX = 0)
    ↓
U2: npm run lint + tsc --noEmit
    ↓
U3: 废弃目录清理 (grep 验证无引用)
    ↓
U4: vitest run 全部通过
```

---

## 5. 测试稳定性规范

### P003 BPMN
- bpmn-js 初始化需等待 DOM 就绪
- XML escaping 已修复（`52b3bf64b` commit）

### P004 Version Compare
- SnapshotSelector 组件测试需 mock versionStore
- diff 高亮测试需提供已知快照 fixture

### P006 Tech Debt
- 动态 require 清理后必须运行完整测试套件
- 废弃目录删除前必须 `grep -r` 确认无引用

---

## 6. 禁止事项

| 规则 | 说明 |
|------|------|
| 禁止 P006 U2~U4 先于 U1 执行 | U1 BLOCKER 必须先解除 |
| 禁止 BPMN XML 静态字符串 | P003: 必须从 flowStore 动态生成 |
| 禁止 P001 API error 静默崩溃 | P001: graceful degradation 必须 |
| 禁止未确认引用就删除废弃目录 | P006-U3: 必须 grep 验证 |
| 禁止新增 ESLint 豁免 | P006: 修复后不得新增 `eslint-disable` |
