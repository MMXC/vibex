# vibex-sprint20-qa — Sprint 20 QA 验收经验

**项目**: vibex-sprint20-qa
**收口时间**: 2026-05-01
**执行人**: coord

---

## 项目概述

| 字段 | 内容 |
|------|------|
| 项目名 | vibex-sprint20-qa |
| 目标 | QA 验证 Sprint 20 四个实施项（P001/P003/P004/P006）产出物完整性 |
| 工作目录 | /root/.openclaw/vibex |
| Epic 数量 | 2（E2-QA: P003+P006 验证；E3-QA: P004 Canvas 虚拟化 E2E）|

## 关键经验

### 1. Playwright 浏览器上下文 vs Node.js 上下文

**问题**: `canvas-virtualization-perf.spec.ts` 初版在 `page.evaluate()` 内部使用 `require('@/stores/...')`，导致 `ReferenceError: require is not defined`。

**根因**: `page.evaluate()` 运行在浏览器上下文（Chromium/Playwright），Node.js 内建模块不可用。

**正确做法**:
- 数据注入：`page.addInitScript()` + `page.context().route()` 拦截 API
- 性能测量：浏览器原生 `performance.now()` + `requestAnimationFrame`
- 状态验证：Playwright `page.locator()` 触发交互 + DOM 属性检查
- **禁止在 `page.evaluate()` 内调用任何 Node.js API**

### 2. E2E 测试被驳回两次的经验

**教训**: tester-e3-qa 连续两次驳回 dev-e3-qa 产出物，都是因为同一个 bug（require()）。

**改进方向**:
- dev 写 E2E 测试前应明确告知 tester 测试运行环境限制
- 复杂数据注入场景优先用 `addInitScript()` + `route()` interception
- 测试文件提交前用 `grep "require("` 自检

### 3. Feature Flag 环境配置陷阱

**教训**: P003 Workbench 上线前需确认 `NEXT_PUBLIC_WORKBENCH_ENABLED=true`，否则 Workbench 路由返回 404。

**改进方向**: 上线前 checklist 增加环境变量验证步骤。

### 4. Backend 服务可达性

**教训**: P006 API 测试中，backend 未运行时前端 route 超时，前端无 503 降级响应。

**改进方向**: 前端 route 应处理 backend 不可达场景，返回 503 + 友好错误提示。

### 5. 经验沉淀流程

**教训**: E2-QA 和 E3-QA 产出了高质量 dev 报告，但经验分散在 tester 和 dev 阶段，最终由 coord-completed 统一沉淀。

**改进方向**: 未来建议每个 Epic 完成后立即执行 `memlocal mine` 写入 learnings，避免收口阶段信息丢失。

---

## Epic 验收结果

| Epic | 产出物 | Dev Commit | Reviewer | 远程验证 |
|------|--------|------------|----------|-----------|
| E2-QA | dev-e2-qa-report.md | `6fe2388f4` (changelog), `b20dbabd7` (P006 tests), `1360a6b2b` (P003 changelog) | ✅ | ✅ |
| E3-QA | canvas-virtualization-perf.spec.ts + dev-e3-qa-report.md | `bc08c8eca`, `c5d90ab6e` (fix) | ✅ | ✅ |

---

## 待处理 Tech Debt

| 项 | 描述 | 优先级 |
|----|------|--------|
| CSRF 保护 | Workbench sessions API 无 CSRF token 验证 | 低 |
| Backend fallback | 前端 route 无 503 降级响应 | 中 |
| WORKBENCH_ENABLED | 生产部署需确认环境变量配置 | 高 |

---

## 上线前必检项

- [ ] `NEXT_PUBLIC_WORKBENCH_ENABLED=true` 已配置
- [ ] `pnpm run test` 全部通过（CI gate）
- [ ] `pnpm run test:e2e` workbench journey 0 failures（Chromium only）
- [ ] OpenClaw gateway 可达性验证（sessions_spawn 依赖）

---

*归档时间: 2026-05-01 13:00 GMT+8*
*归档位置: /root/.openclaw/vibex/docs/.learnings/vibex-sprint20-qa.md*