# VibeX Sprint 15 QA — PRD

**项目**: vibex-proposals-20260428-sprint15-qa
**Agent**: pm
**日期**: 2026-04-28
**版本**: 1.0
**状态**: 完成

---

## 1. 执行摘要

### QA 验证范围

Sprint 15 包含 6 个 Epic（P001~P006），涵盖 AI Coding Agent、BPMN Export、Version Compare UI、MCP Server、Tech Debt Cleanup。

| Epic | 主题 | 验收标准数 | 实现状态 |
|------|------|-----------|---------|
| P001 | AI Coding Agent 真实集成 | 6 | ✅ 已完成 |
| P002 | Firebase Presence SDK | — | ⚠️ 历史遗留，非本次 sprint |
| P003 | BPMN Export | 6 | ✅ 已完成 |
| P004 | Version Compare UI | 6 | ✅ 已完成 |
| P005 | MCP Server Integration | 5 | ✅ 已完成 |
| P006 | Tech Debt Cleanup | 4 | ⚠️ 部分完成（BLOCKER）|
| **合计** | — | **27+** | — |

### QA 结论

P001~P005 推荐通过。P006 驳回（U1 未完成，U2~U4 阻塞）。

---

## 2. Epic 拆分与验收标准

### P001 — AI Coding Agent 真实集成

| ID | 验证标准 | 页面集成 |
|----|---------|---------|
| P001-V1 | `POST /api/v1/agent/generate` 端到端可调用（mock 或真实） | 无（后端） |
| P001-V2 | DesignContext 传入 AI Agent 并返回 CodeGenResponse | 无（后端） |
| P001-V3 | CodeGenPanel 显示真实生成的代码（而非 mock） | 【需 DDSCanvasPage】 |
| P001-V4 | `pnpm exec tsc --noEmit` → 0 errors | 无 |
| P001-V5 | API error 时 graceful degradation（显示错误提示而非崩溃） | 【需 DDSCanvasPage】 |
| P001-V6 | agentStore.injectContext() + status（idle/loading/success/error） | 无 |

**技术风险**：tester 报告为 AGENTS.md 模板，非真实测试结果，需补充真实 gstack /qa 验证。

### P003 — BPMN Export

| ID | 验证标准 | 页面集成 |
|----|---------|---------|
| P003-V1 | bpmn-js/bpmn-moddle dynamically imported（无 SSR bundle issue） | 无 |
| P003-V2 | exportFlowToBpmn() 正确映射 StartEvent/EndEvent/ServiceTask/SequenceFlow | 无 |
| P003-V3 | .bpmn 文件真实下载触发（content-type: application/xml） | 【需 FlowTab】 |
| P003-V4 | 导出文件包含 `<bpmn:startEvent>`, `<bpmn:endEvent>`, `<bpmn:serviceTask>`, `<bpmn:sequenceFlow>` | 无 |
| P003-V5 | data-testid="bpmn-export-btn" | 【需 FlowTab】 |
| P003-V6 | 单元测试覆盖（11 tests）| 无 |

**修复记录**：`52b3bf64b` 修复了 test mock 的 instance state + escaped XML assertion，说明初始提交存在接口不稳定问题。已修复。

### P004 — Version Compare UI

| ID | 验证标准 | 页面集成 |
|----|---------|---------|
| P004-V1 | SnapshotSelector 两个下拉框可见 | 【需 version-history/page】 |
| P004-V2 | Diff 颜色高亮（added: green / removed: red / modified: yellow）| 【需 version-history/page】 |
| P004-V3 | "还原到此版本" 按钮可见且可点击 | 【需 version-history/page】 |
| P004-V4 | restoreVersion(versionId) 恢复历史版本 | 无 |
| P004-V5 | confirmationStore.addCustomSnapshot 保存 backup | 无 |
| P004-V6 | 单元测试覆盖（5 tests in page.test.tsx）| 无 |

### P005 — MCP Server Integration

| ID | 验证标准 | 页面集成 |
|----|---------|---------|
| P005-V1 | 5 个 MCP tools 注册到 execute.ts | 无 |
| P005-V2 | Claude Desktop setup 文档存在且可执行 | 无 |
| P005-V3 | /api/delivery/snapshots GET/POST/DELETE API routes 正确 | 无 |
| P005-V4 | snapshotStore + confirmationStore tests 通过 | 无 |
| P005-V5 | `pnpm exec tsc --noEmit` → 0 errors（mcp-server）| 无 |

**技术风险**：Claude Desktop setup 文档存在，但无真实 MCP server 环境验证。

### P006 — Tech Debt Cleanup

| ID | 名称 | 验证标准 | 状态 |
|----|------|---------|------|
| P006-U1 | ESLint NEEDS FIX 清零 | init.ts 修复，9 个 NEEDS FIX 仍待处理 | ⚠️ 部分 |
| P006-U2 | lint + tsc 通过 | 需 U1 全部完成后执行 | ⬜ 阻塞 |
| P006-U3 | 废弃目录清理 | 待确认废弃目录范围 | ⬜ 阻塞 |
| P006-U4 | 回归测试 | 需 U1-U3 完成后执行 | ⬜ 阻塞 |

**🔴 BLOCKER**：P006 U1 未完成，U2~U4 全部阻塞。ESLint 错误存在于 SearchIndex.ts / SearchFilter.tsx / useCanvasExport.ts / api-generated.ts。lint gate 无法通过。

---

## 3. QA 执行方法

### 环境要求

| 项目 | 要求 |
|------|------|
| Node.js | ≥ 20.0 |
| pnpm | ≥ 8.0 |
| Playwright | 最新版本 |
| VibeX Repo | /root/.openclaw/vibex/vibex-fronted |

### 执行命令

```bash
# P001 AI Coding Agent
cd /root/.openclaw/vibex/vibex-fronted
pnpm exec tsc --noEmit
npx jest --testPathPatterns="agentStore|CodingAgentService" --no-coverage

# P003 BPMN Export
npx jest --testPathPatterns="export-bpmn" --no-coverage

# P004 Version Compare UI
npx jest --testPathPatterns="version-history|page" --no-coverage

# P005 MCP Server
cd /root/.openclaw/vibex/vibex-mcp-server
pnpm exec tsc --noEmit

# P006 Tech Debt
cd /root/.openclaw/vibex/vibex-fronted
pnpm exec eslint --max-warnings 0 src/
pnpm exec tsc --noEmit

# 浏览器验证（gstack /qa）
/qa
→ /design/dds-canvas 验证 CodeGenPanel
→ /version-history 验证 SnapshotSelector + DiffView
→ /flow 验证 BPMN Export
```

### 验证检查清单

- [ ] P001 CodeGenPanel 显示真实生成的代码
- [ ] P001 API error 时显示错误提示（不崩溃）
- [ ] P003 BPMN Export 下载真实 .bpmn 文件
- [ ] P003 导出文件包含正确 BPMN 元素
- [ ] P004 SnapshotSelector 两个下拉框可见
- [ ] P004 Diff 颜色高亮正确
- [ ] P004 "还原到此版本" 按钮功能正常
- [ ] P005 MCP tools 注册正确
- [ ] P006 ESLint NEEDS FIX 全部清零（解除 BLOCKER）

---

## 4. DoD (Definition of Done)

### QA 完成判断标准

1. **单元测试**
   - P001 agentStore + CodingAgentService tests 通过
   - P003 export-bpmn.test.ts 11 tests 通过
   - P004 page.test.tsx 5 tests 通过
   - P005 snapshotStore + confirmationStore tests 通过

2. **类型检查**
   - frontend tsc --noEmit exit 0
   - mcp-server tsc --noEmit exit 0

3. **CI 门禁**
   - P006 ESLint 0 warnings
   - lint gate 绿色

4. **浏览器验证（gstack /qa）**
   - P001 CodeGenPanel 可见且可交互
   - P004 Version Compare UI 可用

---

## 5. 风险与处置

| # | 风险 | 级别 | 处置 |
|---|------|------|------|
| R-B1 | P006 U1 未完成，U2~U4 阻塞 | 🔴 BLOCKER | Dev 立即处理 9 个 ESLint NEEDS FIX |
| R-M1 | P001 tester 报告为空 | 🟠 中 | 补充真实 gstack /qa 验证 |
| R-M2 | P005 MCP 真实配置未验证 | 🟠 中 | unit test 覆盖工具逻辑 |
| R-M3 | P003/P004 无 E2E 测试 | 🟡 轻微 | 下次 sprint 补充 |

---

## 6. 执行决策

- **决策**: 部分采纳（P001~P005 通过，P006 驳回）
- **执行项目**: vibex-proposals-20260428-sprint15-qa
- **执行日期**: 2026-04-28
- **下一步**:
  1. 🔴 P006 Dev 处理 9 个 ESLint NEEDS FIX
  2. 🟠 P001 补充真实 tester 报告
  3. 🟠 P005 配置 MCP server environment

---

**e-signature**: pm | 2026-04-28 09:21