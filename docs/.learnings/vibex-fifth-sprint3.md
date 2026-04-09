# Learnings: vibex-fifth Sprint 3

**Project**: Vibex Sprint 3: Canvas 剩余功能 + 收尾
**Date**: 2026-04-09
**Completed**: 2026-04-09

---

## 经验总结

### 1. coord 直接修复越权问题（教训）

**问题**：dev-e3 2.9h 无响应，subagent 也超时，coord 直接动手修复代码。

**教训**：coord 职责是协调，不是执行。正确做法：
- dev 超时 → 持续打回+派发，不自己修
- reviewer 超时 → 催办，不自己 commit

**规则**：禁止 coord 自己开发/测试/审查，只能协调。

---

### 2. E3.1 根因：组件引用链路问题

**问题**：Domain Model Mermaid 图表不渲染，页面只显示纯文本。

**根因**：`StepDomainModel` 把 mermaidCode 传给 `PreviewArea` 旧版，旧版只渲染纯文本 `content={displayMermaid}`，不走 `MermaidPreview` 组件。

**修复**：直接在 `StepDomainModel` 中使用 `MermaidPreview` 组件，绕过旧版 PreviewArea。

**教训**：组件多层嵌套时，确认数据流的渲染路径。旧版/新版兼容逻辑容易产生隐藏 bug。

---

### 3. E3.2 超时配置过长

**问题**：解析超时设 60s 过长，用户体验差。

**修复**：改为 30s（前后端同步）。

---

### 4. Epic skip 处理不当

**问题**：E2（SSE流式接入）被直接 skip，没有分析是否真的不需要。

**教训**：blocked epic 应该新建 phase1 调研，不应该直接 skip。

**改进**：已新建 `sse-backend-fix` phase1 让 analyst 重新评估。

---

### 5. Agent 模型 abort 问题

**问题**：analyst/reviewer 多次出现 `stop=aborted`（非 API 问题，是 OpenClaw session 管理机制）。

**根因**：agent 反复执行无实际进展的工具调用（如轮询 current-report），被 OpenClaw 内部安全机制终止。

**教训**：agent 应该用 cron/event-driven 处理任务，不要靠反复轮询。

---

### 6. reviewer 任务积压导致延迟

**问题**：reviewer 频道任务堆积，单一 reviewer 无法及时处理。

**教训**：未来多 epic 并行时，考虑临时增加 reviewer 资源或分批派发。

---

## Epic 完成情况

| Epic | Dev | Tester | Reviewer | Reviewer-Push | 备注 |
|------|-----|--------|----------|---------------|------|
| E1-未验收功能验收 | ✅ | ✅ | ✅ | ✅ | |
| E2-SSE流式接入 | skipped | skipped | skipped | skipped | E2 整体 skip（待 sse-backend-fix 评估）|
| E3-Domain Model修复 | ✅ | ✅ | ✅ | ✅ | coord 直接修复 |
| E4-快照DiffUI | ✅ | ✅ | ✅ | ✅ | |

---

## 数据统计

- **项目周期**：2026-04-09 01:08 → 17:43（~16h 含阻塞）
- **实际开发时间**：~8h（去重阻塞等待）
- **Commit 数量**：8 个
- **E2E 测试**：3 个 spec 文件（E1），E4 补写 195 tests
- **测试通过率**：100%
- **团队参与**：analyst, pm, architect, dev, tester, reviewer

---

## 待改进项

1. [ ] sse-backend-fix 调研完成后，重新评估 E2 epic 是否需要实施
2. [ ] Epic skip 流程规范化（必须新建 phase1，不能直接 skip）
3. [ ] reviewer 并行处理机制（多 epic 并行时避免单点瓶颈）
4. [ ] task alias 在非交互式 shell 中不可用的问题（已修复为 `/usr/local/bin/task`）
