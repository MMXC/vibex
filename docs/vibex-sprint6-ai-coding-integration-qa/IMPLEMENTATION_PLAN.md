# Implementation Plan — vibex-sprint6-ai-coding-integration-qa

**项目**: vibex-sprint6-ai-coding-integration-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 设计稿导入 | U1~U2 | 1/2 | U1 |
| E2: AI Coding Agent | U3 | 0/1 | U3 |
| E3: 版本Diff | U4~U5 | 0/2 | U4 |
| E6: 缺陷归档 | U6~U7 | 0/2 | U6 |
| E7: 最终报告 | U8 | 0/1 | U8 |

---

## E1: 设计稿导入

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | /api/chat 审查 | ✅ | — | image_url content part 支持，handler 函数存在 |
| E1-U2 | 测试数据修正 | ⬜ | — | image-ai-import.test.ts 为 6 tests（非 10） |

### E1 Dev Implementation
| ID | Status | Files |
|----|--------|-------|
| E1-impl | ✅ | types/design.ts, stores/designStore.ts, app/api/designs/route.ts, app/api/designs/[id]/route.ts, stores/design/__tests__/designStore.test.ts |


---

## E2: AI Coding Agent

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | mock stub 状态确认 | ⬜ | — | CodingAgentService.ts 含 "TODO: Replace with real agent code"，归档为 BLOCKER（含架构合理性说明）|

### E2-U1 详细说明

**性质评估**: 这是有意的架构占位符，非实现遗漏。
- `sessions_spawn` 是 OpenClaw runtime 内部工具，Next.js 无法直接调用
- UI 层完整，mock 用于开发+测试
- 真实 AI 功能需后端 HTTP API 支持

---

## E3: 版本Diff

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | VersionDiff 组件审查 | ⬜ | — | VersionDiff.tsx + diffVersions() 存在 |
| E3-U2 | 路由页面缺失确认 | ⬜ | U1 | `/canvas/delivery/version/page.tsx` 不存在，归档为 BLOCKER |

---

## E6: 缺陷归档

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E6-U1 | 缺陷归档 | ⬜ | E2-U1,E3-U2 | BLOCKER×2 + P2×1 |
| E6-U2 | qa-final-report.md | ⬜ | E6-U1 | 含所有 Epic PASS/FAIL |

---

## gstack 截图计划

| ID | 目标 | 验证点 | 环境依赖 |
|----|------|--------|---------|
| G1 | /version-history/page | VersionDiff 渲染 | Staging |
| G2 | AgentFeedbackPanel | mock 数据显示 | Staging |
| G3 | /api/chat | base64 图片处理 | Staging |
