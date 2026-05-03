# VibeX Sprint 23 QA — 需求分析报告

**Agent**: analyst
**日期**: 2026-05-03
**阶段**: analyze-requirements
**项目**: vibex-sprint23-qa

---

## 执行摘要

Sprint 23 QA 阶段需要验证 5 个 Epic 的实现状态：
- E1: E2E CI → Slack 报告链路
- E2: Design Review Diff 视图
- E3: Firebase Cursor Sync
- E4: Canvas 导出格式扩展（PlantUML/SVG/JSON Schema）
- E5: 模板库版本历史 + 导入导出

前期审查已完成：Analyst 输出 analysis.md、PM 输出 prd.md、Architect 输出 architecture.md + IMPLEMENTATION_PLAN.md，E2-E5 的 tester 报告均已产出。

本阶段任务是**在前期产出物基础上，补充需求分析视角的评估**，并识别与原始 PRD 的偏差。

---

## 1. 上游产出物概览

| 产出 | 状态 | 说明 |
|------|------|------|
| Analyst analysis.md | ✅ 完成 | 5 个提案问题真实性已验证 |
| PM prd.md | ✅ 完成 | 5 Epic / 16 Story，25h 估算 |
| Architect architecture.md | ✅ 完成 | 技术方案 + 架构图 + 数据模型 |
| Architect IMPLEMENTATION_PLAN.md | ✅ 完成 | 详细任务分解 + 里程碑 |
| tester-e2-design-review-diff | ✅ 完成 | 19 测试通过，0 errors |
| tester-e3-firebase-cursor | ✅ 完成 | 4 测试通过，0 errors |
| tester-e4-export-formats | ✅ 完成 | 17 测试通过（1 环境问题） |
| tester-e5-template-library | ✅ 完成 | 76 测试通过，0 errors |

---

## 2. 业务场景分析

### E1: E2E CI → Slack 报告链路

**业务背景**: VibeX CI 已完成 E2E gate 落地（staging health check、merge-gate、flaky monitor），但 Playwright 报告无法自动推送到 Slack，团队无法实时感知 CI 状态。

**目标用户**: 开发团队（查看 CI 报告）、PM（监控质量趋势）

**核心价值**: CI 结果透明化，减少人工检查 CI 的摩擦。

**关键约束**:
- CI job exit code 必须与 E2E 结果一致（不得因 webhook 失败而污染）
- Slack 消息必须为 Block Kit 格式，含 pass/fail 摘要
- 当前 `scripts/e2e-summary-slack.ts` 未在 CI job 中被调用（核心缺口）

**JTBD**:
1. CI run 结束后自动收到 Slack 消息
2. 消息包含失败用例列表（方便快速定位）
3. Slack webhook 不可用时 CI 仍正常通过

### E2: Design Review 反馈闭环

**业务背景**: 当前 Design Review 仅支持单向输出，用户看到评审结果后无法验证修复效果，无 diff 对比能力。

**目标用户**: 使用 Design Review 的产品/开发人员

**核心价值**: 让评审结果"活起来"，追踪改进而非一次性报告。

**关键约束**:
- ReviewReportPanel 已有 re-review-btn，DiffView 组件已实现
- 后端 `POST /design/review-diff` API 尚未完成（实现计划中）
- diff 算法基于 `item.id` 比对，逻辑清晰

**JTBD**:
1. 修复后能快速对比新旧评审结果（红色 added / 绿色 removed）
2. 每次重评可追溯历史报告 ID
3. diff 视图与现有 ReviewReportPanel 无布局冲突

### E3: Firebase Cursor Sync

**业务背景**: Firebase Presence 仅实现在线状态，cursor 同步从未开始，用户看不到其他人的鼠标位置。

**目标用户**: 多人协作使用 Canvas 的团队

**核心价值**: 实时协作的"存在感"——知道谁在哪、在做什么。

**关键约束**:
- `RemoteCursor.tsx` 组件已实现，含 SVG cursor icon + username label
- `isMockMode=true` 时不渲染（防护）
- `useCursorSync.ts` 已实现 100ms debounce
- presence.ts cursor 字段已扩展（nodeId + timestamp）

**JTBD**:
1. Canvas 内实时看到其他用户的 cursor 位置
2. cursor 显示 username label（方便识别）
3. Firebase mock 模式下稳定降级（不报错）

### E4: Canvas 导出格式扩展

**业务背景**: DDSToolbar 导出仅支持 JSON/Mermaid/OpenAPI，用户需要 PlantUML（StarUML）、SVG（Figma）、JSON Schema。

**目标用户**: 使用 StarUML/Figma 的设计师，生成 API 文档的开发者

**核心价值**: 打通 VibeX 与外部工具生态。

**关键约束**:
- 3 个 exporter 已实现（plantuml.ts / svg.ts / json-schema.ts）
- DDSToolbar.tsx 已添加 3 个 data-testid 验收点
- SVG 降级策略已实现（try-catch + fallbackMessage）
- PlantUML 语法验证已实现

**JTBD**:
1. 一键导出为 StarUML 可打开的 PlantUML 文件
2. 导出 SVG 供 Figma 导入
3. 导出 JSON Schema 用于 API 文档

### E5: 模板库版本历史 + 导入导出

**业务背景**: 模板库基础功能完成（S22 Epic4），但无版本管理、跨设备同步、团队分享能力。

**目标用户**: 需要维护模板版本、跨设备工作的个人用户

**核心价值**: 模板作为"知识资产"可持续积累，而非一次性消耗品。

**关键约束**:
- `useTemplateManager.ts` 已实现 export/import/history
- `TemplateHistoryPanel.tsx` 已实现
- localStorage 最多 10 个 snapshot，超出自动清理最旧
- 分享 link 功能 Phase 2（Sprint 24+）再做

**JTBD**:
1. 模板修改后可回溯历史版本
2. 模板可导出为 JSON 文件备份/迁移
3. 模板可从 JSON 文件恢复

---

## 3. 需求与实现的偏差分析

### E1: 偏差较小

| 项目 | PRD 描述 | 实际状态 |
|------|---------|---------|
| S1.1 | CI e2e job 末尾调用 e2e:summary:slack | **缺失**: 脚本存在，但未在 CI job 中调用 |
| S1.2 | Block Kit 格式 Slack 消息 | **未验证**: 需要真实的 webhook 测试 |

**结论**: 方案清晰，实现缺口明确（CI 配置层），工时 1-2h，风险低。

### E2: 偏差较小

| 项目 | PRD 描述 | 实际状态 |
|------|---------|---------|
| S2.1-S2.3 | 前端 diff 视图 | ✅ 已实现（tester 验证通过） |
| S2.4 | 后端 POST /design/review-diff | ⚠️ **未实现**: IMPLEMENTATION_PLAN 标注为 Backend Dev，但无对应 task |
| diff 算法 | added（红）/ removed（绿） | ✅ 已实现 |

**结论**: 前端交付完整，后端 API 存在缺口。需要确认 Backend 是否有对应任务。

**风险**: 如果 S2.4 后端未实现，前端 diff 功能无法真正工作（目前 diff 在前端计算，不依赖后端）。

### E3: 基本符合

| 项目 | PRD 描述 | 实际状态 |
|------|---------|---------|
| S3.1-S3.3 | cursor sync 全链路 | ✅ 已实现（tester 验证通过） |
| S3.4 | E2E 测试覆盖 cursor sync | ⚠️ **未验证**: tester 报告中未提及 E2E 覆盖 |

**结论**: 实现完整，但 E2E 测试覆盖（S3.4）需要确认。

### E4: 基本符合

| 项目 | PRD 描述 | 实际状态 |
|------|---------|---------|
| 3 个 exporter | PlantUML / SVG / JSON Schema | ✅ 已实现 |
| data-testid 验收点 | plantuml-option / svg-option / schema-option | ✅ 已验证 |
| SVG fallback | 失败显示降级文案 | ✅ 已实现 |
| ExportControls test | 27/28 通过，1 环境问题 | ⚠️ vitest 版本问题，非代码缺陷 |

**结论**: 实现完整，vitest 配置问题是已知技术债，不影响功能。

### E5: 基本符合

| 项目 | PRD 描述 | 实际状态 |
|------|---------|---------|
| 4 个 data-testid | export/import/history/history-item | ✅ 已验证 |
| useTemplateManager | export/import/history/prune | ✅ 已实现 |
| TemplateHistoryPanel | 最多 10 个 snapshot | ✅ 已实现（prune 逻辑正确） |
| 分享 link | Phase 2 Sprint 24+ | ✅ PRD 已规划 |

**结论**: 完全符合 PRD Phase 1 范围。

---

## 4. 技术方案选项

### E1 方案（已选定）

**方案 A: CI 步骤集成（推荐）**
- 在 `.github/workflows/test.yml` e2e job 末尾添加 `pnpm --filter vibex-fronted run e2e:summary:slack`
- 脚本读取 Playwright JSON report，生成 Block Kit，发到 `#analyst-channel`
- `if: always()` 确保 webhook 失败不阻塞 CI exit code
- 工时: 1-2h

**方案 B: GitHub Artifact 中转**
- 上传 report 到 artifact，通过 Google Cloud Storage 或 Slack webhook 下载发送
- 工时: 3-4h，配置复杂度高

### E2 方案（已选定）

**方案 A: 轻量 diff（已实现前端，后端待补）**
- S2.1-S2.3 前端已实现 ✅
- S2.4 后端 `POST /design/review-diff` 需确认开发计划
- 工时: 2h（后端）

**风险**: 后端 API 如果 Sprint 23 不做，前端 diff 功能需要改为纯前端计算（目前 reviewDiff.ts 已是纯前端实现）。

### E3 方案（已实现）

**方案 A: Firebase Cursor Channel**
- 全链路已实现：presence.ts cursor 字段 → RemoteCursor 组件 → useCursorSync debounce
- 唯一缺口: E2E 测试覆盖（S3.4）

### E4 方案（已实现）

**分阶段实现**:
- Phase 1: PlantUML ✅
- Phase 2: JSON Schema ✅
- Phase 3: SVG + fallback ✅

### E5 方案（已实现）

**本地优先**:
- Phase 1: export/import/history ✅
- Phase 2: 后端存储 + 分享 link → Sprint 24+

---

## 5. 可行性评估

| Epic | 技术可行性 | 实现完成度 | 风险 | 结论 |
|------|-----------|-----------|------|------|
| E1 | ✅ 高 | 80%（缺 CI 配置） | Slack webhook 配置 | 通过，需补 CI 配置 |
| E2 | ✅ 高 | 75%（前端完成，后端待确认） | 后端 API 是否 Sprint 23 做 | 有条件通过 |
| E3 | ✅ 高 | 90%（全链路实现） | E2E 覆盖缺口 | 通过，需补 S3.4 |
| E4 | ✅ 高 | 100% | vitest 配置技术债（不阻塞） | 通过 |
| E5 | ✅ 高 | 100% | 无 | 通过 |

---

## 6. 风险矩阵

| 风险 | Epic | 可能性 | 影响 | 缓解 |
|------|------|--------|------|------|
| E1: Slack webhook 配置失败 | E1 | 中 | 中 | `if: always()` + CI exit code 独立 |
| E2: 后端 diff API Sprint 23 不做 | E2 | 中 | 中 | 前端 diff 算法已是纯前端实现，可独立工作 |
| E3: E2E 测试未覆盖 cursor sync | E3 | 高 | 低 | 补充 S3.4 E2E 测试用例 |
| E4: vitest 版本问题影响 CI | E4 | 中 | 低 | 不影响功能，修复是优化项 |
| 跨 Epic: `pnpm run build` 失败 | 全部 | 低 | 高 | 所有 Epic 需最后验证 build |

---

## 7. 验收标准（可测试）

### E1
- [ ] `.github/workflows/test.yml` e2e job 末尾有 `e2e:summary:slack` 调用
- [ ] CI run 后 Slack #analyst-channel 收到 Block Kit 消息
- [ ] Slack 消息含 pass/fail 摘要 + 失败用例列表
- [ ] Slack webhook 不可用时 CI 仍通过（`if: always()`）

### E2
- [ ] ReviewReportPanel 有 `data-testid="re-review-btn"`
- [ ] 重新评审后 DiffView 显示 added（红）/ removed（绿）
- [ ] diff 计算基于 `item.id` 比对，逻辑正确
- [ ] `pnpm run build` → 0 errors

### E3
- [ ] RemoteCursor 组件存在，SVG cursor icon + username label
- [ ] `isMockMode=true` 时组件不渲染
- [ ] cursor 同步延迟 < 200ms（100ms debounce + 网络延迟）
- [ ] E2E 测试覆盖 cursor sync 场景（S3.4）

### E4
- [ ] `DDSToolbar.tsx` 含 `plantuml-option` / `svg-option` / `schema-option` data-testid
- [ ] PlantUML 导出文件 `.puml` 后缀，StarUML 可打开
- [ ] SVG 导出失败时显示"当前视图不支持 SVG 导出"
- [ ] `pnpm run build` → 0 errors

### E5
- [ ] `template-export-btn` / `template-import-btn` / `template-history-btn` / `history-item` data-testid 全存在
- [ ] 模板导出触发 JSON download
- [ ] 模板导入解析 JSON 文件并恢复
- [ ] 历史面板最多显示 10 个 snapshot，超出自动清理
- [ ] `pnpm run build` → 0 errors

---

## 8. 依赖分析

```
E1: CI 配置（无依赖）→ 可立即执行
E2: S2.1-S2.3 前端（无依赖）✅ 已完成
     S2.4 后端 API（依赖 Backend Dev）→ 需确认计划
E3: S3.1-S3.3（无依赖）✅ 已完成
     S3.4 E2E 测试（依赖 E2E 框架）→ 需补充
E4: 无依赖 → 全部完成 ✅
E5: 无依赖 → 全部完成 ✅
```

**关键路径**: E1 CI 配置（执行者: Dev）+ E2 后端 API（执行者: Backend Dev）+ E3 E2E 测试覆盖

---

## 9. 识别的问题

### 问题 1: E2 后端 diff API 无对应 task
S2.4 (`POST /design/review-diff` 后端 API) 在 PRD 中，但 IMPLEMENTATION_PLAN 中标注执行者为 Backend Dev，且没有独立的 team-tasks 条目。如果 Sprint 23 不做，前端 diff 功能仍可工作（reviewDiff.ts 纯前端），但无法做跨报告的 Server-side diff。

**建议**: 请 Coord 确认 Backend Dev 是否会在 Sprint 23 实现 S2.4。

### 问题 2: E3 E2E 测试覆盖缺失
S3.4 要求 E2E 测试覆盖 cursor sync 场景，但 tester 报告未涉及。`firebase-presence-latency.test.ts` 只测试 Firebase latency，未覆盖 Playwright E2E 层。

**建议**: 补充 Playwright E2E 测试用例，测试 RemoteCursor 在真实 Firebase 环境下的渲染。

### 问题 3: vitest 版本导致 ExportControls 测试 1/28 失败
`vi.isolateModules is not a function` 是 Vitest 版本问题，非代码缺陷。建议修复为 `vi.mock` + `vi.doMock` 模式。

**建议**: 作为技术债在 Sprint 24 优化，不阻塞 Sprint 23。

---

## 10. 审查结论

| Epic | 结论 | 理由 |
|------|------|------|
| E1 | ✅ **通过（补充项）** | CI 配置缺口明确，1-2h 可完成，无阻塞风险 |
| E2 | ⚠️ **有条件通过** | 前端完成，后端 API 待确认（影响低） |
| E3 | ✅ **通过（补充项）** | 全链路完成，缺 E2E 覆盖（2-3h 可补） |
| E4 | ✅ **通过** | 实现完整，vitest 配置问题是已知技术债 |
| E5 | ✅ **通过** | 完全符合 PRD Phase 1 范围 |

**总体结论**: 5 个 Epic 全部具备实施条件。E1 和 E3 有明确的补充项（CI 配置 + E2E 覆盖），不影响 Sprint 23 DoD。E2 后端 API 需要 Coord 确认。

---

## 11. 下一步行动

| 优先级 | 行动 | 执行者 |
|--------|------|--------|
| P0 | E1: 在 CI workflow 中添加 e2e:summary:slack 步骤 | Dev |
| P0 | E2: 请 Coord 确认 S2.4 后端 API 开发计划 | Analyst → Coord |
| P1 | E3: 补充 cursor sync E2E 测试用例 | Dev |
| P1 | E4: vitest 配置优化（技术债） | Dev |
| P2 | E5: 无需行动 | - |

---

## 执行决策

- **决策**: 已采纳（有条件）
- **执行项目**: vibex-sprint23-qa
- **执行日期**: 2026-05-03
- **条件**: E1/E3 补充项在 Sprint 23 完成，E2 后端 API 由 Coord 确认后纳入 Sprint 23 或延后

---

*生成时间: 2026-05-03 07:50 GMT+8*
*Analyst Agent | VibeX Sprint 23 QA — 需求分析*