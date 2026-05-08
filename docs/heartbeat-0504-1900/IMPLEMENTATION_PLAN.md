# VibeX Sprint 8 — 实施计划 (IMPLEMENTATION_PLAN.md)

> **项目**: heartbeat (VibeX Sprint 8)
> **阶段**: design-architecture
> **版本**: v1.0
> **日期**: 2026-05-08
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: TypeScript 债务清理 | E1-U1 ~ E1-U3 | 3/3 ✅ | — |
| E2: Firebase 可行性验证 | E2-U1 ~ E2-U5 | 0/5 | E2-U1 |
| E3: Import/Export E2E 覆盖 | E3-U1 ~ E3-U4 | 0/4 | E3-U1 |
| E4: PM 质量门禁 | E4-U1 ~ E4-U3 | 0/3 | E4-U1 |

**总工时**: 13.5d（不含 P001 已完成部分）
**阻塞关系**: E2-U2~U5 blocked by E2-U1 "可行"结论

---

## E1: TypeScript 债务清理

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | 安装 @cloudflare/workers-types 类型包 | ✅ | — | `pnpm list @cloudflare/workers-types` 显示已安装，版本 `^4.20260424.1` |
| E1-U2 | 批量修复 TS 编译错误 | ✅ | E1-U1 | `cd vibex-backend && pnpm exec tsc --noEmit` exit code = 0；`cd vibex-fronted && pnpm exec tsc --noEmit` exit code = 0 |
| E1-U3 | CI tsc gate 验证 | ✅ | E1-U2 | `.github/workflows/test.yml` 包含 `typecheck-backend` + `typecheck-frontend` jobs；push 到 main/develop 触发 CI |

### E1-U1 详细说明

**验证命令**:
```bash
cd /root/.openclaw/vibex/vibex-backend && pnpm exec tsc --noEmit
# Exit code 0 ✅
cd /root/.openclaw/vibex/vibex-fronted && pnpm exec tsc --noEmit
# Exit code 0 ✅
```

**风险**: 无。实测已通过。

---

## E2: Firebase 可行性验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | Architect Firebase SDK 可行性评审 | ⬜ | — | 产出 `docs/heartbeat/firebase-feasibility-review.md`，含冷启动性能数据（ms）；评审结论：可行/不可行；包含降级路径（回退到 REST Presence）|
| E2-U2 | Firebase SDK 冷启动性能测试 | ⬜ | E2-U1 结论为"可行" | Playwright E2E 测量 SDK init 时间，目标 < 500ms；超时触发降级 |
| E2-U3 | Presence 更新延迟验证 | ⬜ | E2-U2 | 单用户 Presence 更新延迟 < 1s（Playwright 测量） |
| E2-U4 | Analytics Dashboard 页面集成 | ⬜ | E2-U1 结论为"可行" | `/dashboard` 页面 `.analytics-widget` 可见（`isVisible('.analytics-widget')` = true）；数据刷新间隔 30s ±5s |
| E2-U5 | SSE bridge 改造 | ⬜ | E2-U2, E2-U3 | GET `/api/presence/stream` 返回 `content-type: text/event-stream`；冷启动超时 5s 自动降级到 REST Presence |

### E2-U1 详细说明

**文件变更**: 新建文档
- `docs/heartbeat/firebase-feasibility-review.md`

**实现步骤**:
1. 阅读 `vibex-backend/src/lib/` 现有 Presence 实现
2. 安装 `firebase-admin` 包（仅测试用，不合并到 package.json）
3. 在 Cloudflare Workers 模拟环境中测试 Firebase SDK init 时间
4. 记录冷启动延迟数据（5次测量取中位数）
5. 评估 Firestore/Auth 模块可用性
6. 定义降级路径：不可行时回退到现有 REST Presence API

**验收标准细项**:
- AC1: [性能数据] Firebase SDK init 时间 < 500ms（中位数，5次测量）
- AC2: [兼容性] Firebase Auth 模块在 Workers 环境中可正常初始化
- AC3: [降级路径] 文档包含明确降级路径（回退到 REST Presence）
- AC4: [风险披露] 冷启动场景下 SSE 连接失败的处理方式已定义

**风险**: ⚠️ E2-U1 结论为"不可行"时，E2-U2~E2-U5 全部降级，实际工时从 5d → 0d

---

### E2-U2 详细说明

**文件变更**: 新建测试
- `vibex-fronted/e2e/firebase/cold-start.spec.ts`

**实现步骤**:
1. 创建 Playwright E2E 测试文件
2. 使用 `performance.now()` 测量从 import firebase 到 first API call 的时间
3. 阈值：< 500ms 通过，≥ 500ms 触发降级到 REST Presence
4. 测试环境：禁用 cache（模拟冷启动）

**验收标准细项**:
- AC1: [性能条件] Firebase init 时间 < 500ms（5次测量中位数）
- AC2: [降级触发] init 时间 ≥ 500ms 时，SSE bridge 自动降级到 REST Presence
- AC3: [无崩溃] init 失败时页面不崩溃，显示错误提示

---

### E2-U4 详细说明

**文件变更**: 新建 + 修改
- `vibex-fronted/src/components/dashboard/AnalyticsWidget.tsx`（新建）
- `vibex-fronted/src/app/dashboard/page.tsx`（修改，集成 Widget）

**实现步骤**:
1. 创建 `AnalyticsWidget` 组件，实现四态（加载中/有数据/空数据/错误）
2. 创建 `StatCard` 子组件，含间距规范（16px/24px/8px）
3. 颜色使用 Design Token（`--color-stat-card-bg` 等）
4. 集成到 `/dashboard` 页面
5. 数据刷新周期：30s（误差 ±5s）

**验收标准细项**:
- AC1: [可见性] `.analytics-widget` 元素可见
- AC2: [四态-加载中] 加载时显示骨架屏（`.skeleton-card`），无 loading spinner
- AC3: [四态-有数据] 数据存在时显示 stat-card，数字使用等宽字体
- AC4: [四态-空数据] 数据为空时显示引导文案 + 插图，禁止留白
- AC5: [四态-错误] 加载失败显示错误类型（网络/权限/超时/数据超长）+ 重试按钮
- AC6: [响应式] Mobile (< 640px) 卡片纵向堆叠，Desktop 横向排列

---

### E2-U5 详细说明

**文件变更**: 新建
- `vibex-backend/src/lib/sse-bridge.ts`（新建）
- `vibex-backend/src/routes/presence-stream.ts`（新建）

**实现步骤**:
1. 创建 SSE bridge 实现，支持 Firebase SDK 推送
2. 实现冷启动 fallback：超时 5s 自动降级到 REST Presence
3. 实现 `AbortSignal` 处理，客户端断开时清理连接
4. SSE 事件格式：
   - `event: presence_update` → `data: {"userId": "xxx", "status": "online", "timestamp": ...}`
   - `event: heartbeat` → `data: {"ts": ...}`

**验收标准细项**:
- AC1: [协议] GET `/api/presence/stream` 返回 `content-type: text/event-stream`
- AC2: [超时降级] SDK init 超时 5s 时自动降级到 REST Presence，不返回 500
- AC3: [连接清理] 客户端 disconnect 时服务端正确关闭 SSE 连接
- AC4: [错误格式] SDK 不可用时返回 JSON 错误 `{"error": "...", "message": "..."}`

---

## E3: Import/Export E2E 覆盖

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | Teams API E2E 验证 | ⬜ | — | Playwright E2E 打开 `/teams`，`.teams-list` 可见，`.team-item` 数量 > 0 |
| E3-U2 | JSON round-trip E2E | ⬜ | — | 导出 JSON → 删除数据 → 导入 → JSON.stringify 对比，内容完全一致 |
| E3-U3 | YAML round-trip E2E | ⬜ | — | YAML 含特殊字符（`: # | 多行`）round-trip 无转义丢失 |
| E3-U4 | 5MB 文件大小限制 | ⬜ | — | 前端拦截 6MB 文件，显示错误文案"文件大小超出 5MB 限制" |

### E3-U1 详细说明

**文件变更**: 新建测试
- `vibex-fronted/e2e/teams/teams-api.spec.ts`

**实现步骤**:
1. 创建 Playwright E2E 测试文件
2. 导航到 `/teams` 页面
3. 等待 `.teams-list` 加载
4. 验证至少存在 1 个 `.team-item`

**验收标准细项**:
- AC1: [页面导航] `page.goto('/teams')` 无 404/500
- AC2: [列表可见] `.teams-list` 元素存在且可见
- AC3: [数据存在] `.team-item` 数量 > 0（使用 test account）

---

### E3-U2 详细说明

**文件变更**: 新建测试
- `vibex-fronted/e2e/import-export/json-roundtrip.spec.ts`
- `vibex-fronted/e2e/fixtures/test-data.json`（测试数据）

**实现步骤**:
1. 创建固定测试数据 JSON 文件（含嵌套对象、数组、字符串）
2. Playwright E2E：导出 → 下载 → 删除 → 导入 → 重新导出
3. JSON.stringify 对比两次导出内容

**验收标准细项**:
- AC1: [导出成功] 点击导出按钮，触发 JSON 文件下载
- AC2: [数据完整性] 导出内容包含所有测试字段（ID、name、nested、array）
- AC3: [导入成功] 导入后 API 返回 200
- AC4: [内容一致] 首次导出和重新导出的 JSON 内容完全一致（`JSON.stringify(parse1) === JSON.stringify(parse2)`）
- AC5: [无数据丢失] 嵌套对象、数组字段数量一致

---

### E3-U3 详细说明

**文件变更**: 新建测试
- `vibex-fronted/e2e/import-export/yaml-roundtrip.spec.ts`
- `vibex-fronted/e2e/fixtures/test-data.yaml`（测试数据，含特殊字符）

**实现步骤**:
1. 创建测试 YAML，含边界字符：
   - 冒号 `:` 和 `::`
   - 井号 `#`（注释符号）
   - 管道符 `|`（多行文本）
   - 特殊符号 `\"'[]{}`
   - Emoji `🎉🚀`
2. Playwright E2E：导出 → 下载 → 导入 → 验证内容
3. 重点验证 `|` 字符的多行文本无转义丢失

**验收标准细项**:
- AC1: [特殊字符-冒号] 含 `:` 的值 round-trip 后保持原值
- AC2: [特殊字符-井号] 含 `#` 的值 round-trip 后不被误判为注释
- AC3: [特殊字符-多行] `|` 多行文本 round-trip 后行数一致，无额外换行
- AC4: [特殊字符-Emoji] Emoji round-trip 后完全一致
- AC5: [无转义丢失] 转义字符 `\\n` round-trip 后变成真实换行而非字面量

---

### E3-U4 详细说明

**文件变更**: 修改
- `vibex-fronted/src/components/import/ImportForm.tsx`（修改，添加大小校验）

**实现步骤**:
1. 在 `ImportForm` 中添加 `MAX_FILE_SIZE = 5 * 1024 * 1024`
2. `onChange` 时校验 `file.size > MAX_FILE_SIZE`
3. 超限显示错误文案，不触发上传

**验收标准细项**:
- AC1: [拦截] 6MB 文件上传被前端拦截，不发送 API 请求
- AC2: [错误文案] 显示"文件大小超出 5MB 限制，请拆分文件或压缩后再试"
- AC3: [正常文件] 4.9MB 文件正常上传，无错误提示
- AC4: [边界值] 5,242,880 bytes（5MB + 1KB）被拦截

**注意**: 后端应同时配置 `multipart file size limit` 作为双重保险

---

## E4: PM 质量门禁

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | Coord 评审检查点更新 | ⬜ | — | `docs/coord/review-checklist.md` 包含四态表/Design Token/情绪地图检查点；PM 提交提案时触发自动检查 |
| E4-U2 | PRD 模板更新 | ⬜ | — | `docs/templates/prd-template.md` 包含"本期不做"章节 + 神技指引（剥洋葱/极简主义/老妈测试）|
| E4-U3 | SPEC 模板更新 | ⬜ | E4-U2 | `docs/templates/spec-template.md` 包含四态表 + Design Token 规范 + 情绪地图路径引用 |

### E4-U1 详细说明

**文件变更**: 修改
- `vibex/docs/coord/review-checklist.md`

**实现步骤**:
1. 阅读现有 `docs/coord/review-checklist.md`
2. 新增 "PM 神技检查点" 章节
3. 检查点内容：
   - [ ] **四态表**：提案是否定义了四态（默认/加载中/有数据/空状态/错误）
   - [ ] **Design Token**：提案是否定义了 CSS 变量体系，无硬编码颜色/字号
   - [ ] **情绪地图**：提案是否描述了用户情绪路径和兜底机制
4. 更新后告知全体团队成员

**验收标准细项**:
- AC1: [章节存在] review-checklist.md 包含"PM 神技检查点"章节
- AC2: [四态检查] 检查点包含"四态表"关键词
- AC3: [Token 检查] 检查点包含"Design Token"关键词
- AC4: [情绪检查] 检查点包含"情绪地图"关键词
- AC5: [通知团队] Slack 公告已发送，团队已知悉

---

### E4-U2 详细说明

**文件变更**: 修改
- `vibex/docs/templates/prd-template.md`

**实现步骤**:
1. 阅读现有 PRD 模板
2. 新增章节：
   - **2a. 本质需求穿透**（神技1）：每个 Epic 必须回答"去掉现有方案，理想解法是什么"
   - **2b. 最小可行范围**（神技2）：每个 Epic 必须区分"本期必做/本期不做/暂缓"
   - **2c. 用户情绪地图**（神技3）：关键页面必须描述进入情绪/引导文案/兜底机制
3. 新增"本期不做"清单章节

**验收标准细项**:
- AC1: [本质需求] 模板包含"本质需求穿透"章节说明
- AC2: [极简主义] 模板包含"最小可行范围"章节说明
- AC3: [情绪地图] 模板包含"用户情绪地图"章节说明
- AC4: [本期不做] 模板包含"本期不做"清单章节

---

### E4-U3 详细说明

**文件变更**: 修改
- `vibex/docs/templates/spec-template.md`

**实现步骤**:
1. 阅读现有 SPEC 模板
2. 新增章节：
   - **四态表**：组件四态定义（理想态/空状态/加载态/错误态）规范
   - **Design Token**：CSS 变量体系规范，禁止硬编码色值
   - **情绪地图路径**：Spec 中必须包含 `## 4. 用户情绪地图` 章节

**验收标准细项**:
- AC1: [四态规范] SPEC 模板包含组件四态定义规范
- AC2: [Token 规范] SPEC 模板包含 Design Token 使用规范
- AC3: [情绪地图] SPEC 模板包含情绪地图章节引用

---

## 依赖关系图

```
E1-U1 → E1-U2 → E1-U3 ✅ 已完成

E2-U1 → E2-U2 → E2-U3 → E2-U5
       ↘ E2-U4 ↗

E3-U1, E3-U2, E3-U3, E3-U4 (可并行)

E4-U1 → E4-U2 → E4-U3
```

---

## 风险摘要

| Epic | 主要风险 | 缓解 |
|------|----------|------|
| E1 | 无（已完成） | — |
| E2 | E2-U1 结论为"不可行"导致后续 4 个 Unit 全部降级 | S1 先执行；定义明确降级路径 |
| E3 | Round-trip 发现数据格式不兼容 | 先用真实数据跑一遍，再写 Playwright |
| E4 | 检查点更新影响现有流程 | E4-U1 作为第一优先级（2d 内完成），提前告知团队 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 无（Coord 决策后绑定）
- **执行日期**: 待定

---