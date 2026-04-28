# VibeX Sprint 16 — PRD

**项目**: vibex-proposals-20260428-sprint16
**Agent**: pm
**日期**: 2026-04-28
**版本**: 1.0
**状态**: 完成

---

## 1. 执行摘要

### Sprint 16 目标

基于 Sprint 1-15 交付成果，识别 6 个高优先级功能增强方向。

| 提案 | 主题 | 优先级 | 状态 |
|------|------|--------|------|
| S16-P0-1 | Design Review UI 集成 | 🔴 P0 | ✅ 通过 |
| S16-P0-2 | Design-to-Code 双向同步验证 | 🔴 P0 | ✅ 通过 |
| S16-P1-1 | Firebase Mock 验证 + 配置路径 | 🟠 P1 | ⚠️ 重构后通过 |
| S16-P1-2 | Code Generator 真实组件生成 | 🟠 P1 | ✅ 通过 |
| S16-P2-1 | Canvas 版本历史生产集成 | 🟡 P2 | ✅ 通过 |
| S16-P2-2 | MCP Tool 治理与文档 | 🟡 P2 | ✅ 通过 |

---

## 2. Epic 拆分与验收标准

### S16-P0-1 — Design Review UI 集成

| ID | 验收标准 | 页面集成 |
|----|---------|---------|
| P0-1-V1 | DDSToolbar 有 Design Review 按钮（data-testid="design-review-btn"） | 【需 DDSToolbar】 |
| P0-1-V2 | 点击后调用 `review_design` MCP tool，返回结果正确展示 | 【需 DDSToolbar】 |
| P0-1-V3 | ReviewReportPanel 显示 Compliance / Accessibility / Reuse 三段 | 【需 ReviewReportPanel】 |
| P0-1-V4 | 无设计问题时显示"设计合规"状态 | 【需 ReviewReportPanel】 |
| P0-1-V5 | 违反 WCAG AA 时高亮对应节点（点击高亮跳转）| 【需 ReviewReportPanel】 |
| P0-1-V6 | Ctrl+Shift+R 快捷键触发 Design Review | 无（快捷键） |
| P0-1-V7 | 单元测试覆盖 CodeGenPanel 相关组件 ≥ 10 tests | 无 |
| P0-1-V8 | E2E：`pnpm playwright test design-review.spec.ts` 全通过 | 无（E2E） |

### S16-P0-2 — Design-to-Code 双向同步验证

| ID | 验收标准 | 页面集成 |
|----|---------|---------|
| P0-2-V1 | E2E 测试覆盖完整 pipeline（figma-import → token → drift → code-gen → batch-export）| 无（E2E） |
| P0-2-V2 | Drift Detection 在 3 种冲突场景准确性验证（误报率 < 10%）| 无 |
| P0-2-V3 | Batch Export 50 组件并发导出稳定性（无内存泄漏）| 无 |
| P0-2-V4 | ConflictResolutionDialog 三面板 Diff UI 真实冲突场景可正常使用 | 【需 DDSCanvasPage】 |
| P0-2-V5 | `pnpm playwright test design-to-code-e2e.spec.ts` 全通过 | 无（E2E） |
| P0-2-V6 | 验证报告存档：`docs/vibex-sprint16/design-to-code-verification.md` | 无 |

### S16-P1-1 — Firebase Mock 验证 + 配置路径（重构）

| ID | 验收标准 | 页面集成 |
|----|---------|---------|
| P1-1-V1 | 5 用户并发 presence E2E 测试（mock 模式）全通过 | 无（E2E） |
| P1-1-V2 | Firebase mock 降级路径完整（四态 UI + 断线重连）| 【需 DDSCanvasPage】 |
| P1-1-V3 | ConflictBubble 在 mock 冲突场景正确触发 | 【需 DDSCanvasPage】 |
| P1-1-V4 | Firebase 配置路径确认文档产出 | 无 |
| P1-1-V5 | 量化报告：冷启动 < 500ms 或给出替代方案 | 无 |

### S16-P1-2 — Code Generator 真实组件生成

| ID | 验收标准 | 页面集成 |
|----|---------|---------|
| P1-2-V1 | `FlowStepCard` 节点生成 `FlowStepProps` 接口（含 stepName/actor/pre/post）| 无 |
| P1-2-V2 | `APIEndpointCard` 节点生成 `APIEndpointProps` 接口（含 method/path/summary）| 无 |
| P1-2-V3 | `StateMachineCard` 节点生成 `StateMachineProps` 接口（含 states/transitions）| 无 |
| P1-2-V4 | 生成的 TSX 使用节点属性值（而非注释占位）| 无 |
| P1-2-V5 | CodeGenPanel 支持 framework selector（React/Vue/Solid）| 【需 CodeGenPanel】 |
| P1-2-V6 | 生成的代码可复制粘贴到 VS Code 直接运行（无语法错误）| 无 |
| P1-2-V7 | `npx vitest run codeGenerator.test.ts` 全通过 | 无 |
| P1-2-V8 | `pnpm playwright test code-generator-e2e.spec.ts` 全通过 | 无（E2E） |

### S16-P2-1 — Canvas 版本历史生产集成

| ID | 验收标准 | 页面集成 |
|----|---------|---------|
| P2-1-V1 | Canvas 编辑后 30s 自动创建快照（防抖）| 无 |
| P2-1-V2 | VersionHistoryPanel 区分"自动保存"和"手动保存"快照 | 【需 VersionHistoryPanel】 |
| P2-1-V3 | projectId=null 时引导 UI 正确显示 | 【需 VersionHistoryPanel】 |
| P2-1-V4 | 快照恢复后 Canvas 正确显示历史内容 | 【需 DDSCanvasPage】 |
| P2-1-V5 | `pnpm playwright test version-history-e2e.spec.ts` 全通过 | 无（E2E） |

### S16-P2-2 — MCP Tool 治理与文档

| ID | 验收标准 | 页面集成 |
|----|---------|---------|
| P2-2-V1 | `docs/mcp-tools/review_design.md` 完整（含参数/示例/返回格式）| 无 |
| P2-2-V2 | `docs/mcp-tools/figma_import.md` 完整 | 无 |
| P2-2-V3 | `docs/mcp-tools/generate_code.md` 完整 | 无 |
| P2-2-V4 | `docs/mcp-tools/INDEX.md` 自动生成 | 无 |
| P2-2-V5 | Health Check 端点返回完整 tool 列表 | 无 |

---

## 3. QA 执行方法

### 执行命令

```bash
# S16-P0-1 Design Review UI
cd /root/.openclaw/vibex/vibex-fronted
pnpm exec playwright test design-review.spec.ts

# S16-P0-2 Design-to-Code E2E
pnpm exec playwright test design-to-code-e2e.spec.ts

# S16-P1-1 Firebase Mock
pnpm exec playwright test firebase-presence-mock.spec.ts

# S16-P1-2 Code Generator
npx vitest run codeGenerator.test.ts
pnpm exec playwright test code-generator-e2e.spec.ts

# S16-P2-1 Version History
pnpm exec playwright test version-history-e2e.spec.ts

# 类型检查
pnpm exec tsc --noEmit
```

### 验证检查清单

- [ ] DDSToolbar 有 Design Review 按钮（data-testid）
- [ ] ReviewReportPanel 显示三段结果
- [ ] Design-to-Code 完整 pipeline E2E 通过
- [ ] Batch Export 50 组件并发无内存泄漏
- [ ] Firebase mock 降级路径完整
- [ ] Code Generator 生成真实 TSX（节点属性）
- [ ] Auto-snapshot 30s 防抖正常
- [ ] MCP tools 文档完整

---

## 4. DoD (Definition of Done)

1. **E2E 测试全部通过**
   - design-review.spec.ts
   - design-to-code-e2e.spec.ts
   - code-generator-e2e.spec.ts
   - version-history-e2e.spec.ts

2. **单元测试全部通过**
   - codeGenerator.test.ts ≥ 25 tests
   - CodeGenPanel 相关组件 ≥ 10 tests

3. **类型检查通过**
   - frontend tsc --noEmit exit 0
   - mcp-server tsc --noEmit exit 0

4. **文档完整**
   - MCP tools 文档覆盖所有 registered tools
   - Firebase 配置路径确认文档产出

---

## 5. 风险与处置

| # | 风险 | 级别 | 处置 |
|---|------|------|------|
| R1 | S16-P1-1 Firebase 真实配置未知 | 🟡 中 | Mock 验证 + 配置路径确认 |
| R2 | S16-P0-2 E2E mock vs 真实数据差异 | 🟡 中 | 验证报告存档 |
| R3 | S16-P1-2 节点属性读取可能影响现有功能 | 🟢 低 | 纯扩展，不破坏现有接口 |

---

## 6. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260428-sprint16
- **执行日期**: 2026-04-28

---

**e-signature**: pm | 2026-04-28 12:27