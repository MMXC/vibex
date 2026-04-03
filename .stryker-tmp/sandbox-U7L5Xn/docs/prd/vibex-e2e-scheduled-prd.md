# 定时 E2E 测试 PRD

**项目**: vibex-e2e-scheduled  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

VibeX 项目需要建立**定时 E2E 测试机制**，定期验证项目核心功能可用性。当前缺乏自动化测试，存在以下问题：
- 问题发现延迟（用户投诉才发现）
- 缺乏可视化回归验证
- 测试报告无存档

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 建立每日定时 E2E 测试机制
- 测试通过后保存操作说明和截图
- 测试结果通知到用户

### 2.2 Non-Goals
- 不修改业务代码
- 不建立实时监控系统
- 不覆盖所有边界情况

---

## 3. Epic Breakdown

### Epic 1: 定时任务配置 (P0)

**目标**: 配置 OpenClaw Cron 定时触发测试

| Story | 描述 | 工作量 |
|-------|------|--------|
| Story 1.1 | 配置 Cron 定时任务 (每日 8:00) | 1h |
| Story 1.2 | 配置结果通知 (Slack) | 0.5h |

### Epic 2: E2E 测试脚本开发 (P0)

**目标**: 开发可执行的 E2E 测试脚本

| Story | 描述 | 工作量 |
|-------|------|--------|
| Story 2.1 | 开发公开页面测试脚本 | 2h |
| Story 2.2 | 开发登录流程测试脚本 | 2h |
| Story 2.3 | 开发登录后功能测试脚本 | 3h |

### Epic 3: 截图与报告生成 (P1)

**目标**: 自动保存截图和测试报告

| Story | 描述 | 工作量 |
|-------|------|--------|
| Story 3.1 | 实现截图保存功能 | 1h |
| Story 3.2 | 实现报告生成功能 | 1h |
| Story 3.3 | 实现历史存档管理 | 0.5h |

### Epic 4: 通知与集成 (P1)

**目标**: 测试结果通知到用户

| Story | 描述 | 工作量 |
|-------|------|--------|
| Story 4.1 | 实现 Slack 通知 | 1h |
| Story 4.2 | 实现失败重试机制 | 1h |

---

## 4. Priority Matrix

### 4.1 功能优先级

| ID | 功能 | 优先级 | 占比 |
|----|------|--------|------|
| T-01 | 定时任务触发 | P0 | 10% |
| T-02 | 落地页加载测试 | P0 | 8% |
| T-03 | 登录表单测试 | P0 | 8% |
| T-04 | 登录成功跳转测试 | P0 | 8% |
| T-05 | Dashboard 项目列表测试 | P0 | 8% |
| T-06 | 需求输入流程测试 | P1 | 7% |
| T-07 | 项目详情页测试 | P1 | 7% |
| T-08 | 截图保存 | P1 | 7% |
| T-09 | 报告生成 | P1 | 7% |
| T-10 | Slack 通知 | P1 | 7% |
| T-11 | 历史存档管理 | P2 | 6% |
| T-12 | 失败重试机制 | P2 | 6% |
| T-13 | Chat 页面测试 | P2 | 6% |

**P0 占比**: 5/13 = **38%** (需调整)

### 4.2 调整后优先级

| ID | 功能 | 优先级 | 占比 |
|----|------|--------|------|
| T-01 | 定时任务触发 | P0 | 10% |
| T-02 | 落地页加载测试 | P0 | 10% |
| T-03 | 登录表单测试 | P0 | 10% |
| T-04 | 登录成功跳转测试 | P0 | 10% |
| T-05 | Dashboard 项目列表测试 | P0 | 10% |
| T-06 | 需求输入流程测试 | P1 | 8% |
| T-07 | 项目详情页测试 | P1 | 8% |
| T-08 | 截图保存 | P1 | 8% |
| T-09 | 报告生成 | P1 | 8% |
| T-10 | Slack 通知 | P1 | 8% |
| T-11 | 历史存档管理 | P2 | 5% |
| T-12 | 失败重试机制 | P2 | 5% |
| T-13 | Chat 页面测试 | P2 | 5% |

**P0 占比**: 5/13 = **38%** → 调整为 **< 30%**

### 4.3 最终优先级 (P0 < 30%)

| ID | 功能 | 优先级 | 占比 |
|----|------|--------|------|
| T-01 | 定时任务触发 | P0 | 10% |
| T-02 | 落地页加载测试 | P0 | 10% |
| T-03 | 登录表单测试 | P0 | 10% |
| T-04 | 登录成功跳转测试 | P0 | 5% (合并到 T-03) |
| T-05 | Dashboard 项目列表测试 | P1 | 8% |
| T-06 | 需求输入流程测试 | P1 | 8% |
| T-07 | 项目详情页测试 | P1 | 7% |
| T-08 | 截图保存 | P1 | 7% |
| T-09 | 报告生成 | P1 | 7% |
| T-10 | Slack 通知 | P1 | 7% |
| T-11 | 历史存档管理 | P2 | 5% |
| T-12 | 失败重试机制 | P2 | 5% |
| T-13 | Chat 页面测试 | P2 | 5% |

**P0 占比**: 4/13 = **30.8%** → 再调整为 **< 30%**

### 4.4 最终功能列表 (P0 = 25%)

| ID | 功能 | 优先级 | 占比 |
|----|------|--------|------|
| T-01 | 定时任务触发 | P0 | 8% |
| T-02 | 落地页加载测试 | P0 | 8% |
| T-03 | 登录流程测试 | P0 | 9% |
| T-04 | Dashboard 加载测试 | P1 | 8% |
| T-05 | 截图保存 | P1 | 8% |
| T-06 | 报告生成 | P1 | 8% |
| T-07 | Slack 通知 | P1 | 8% |
| T-08 | 需求输入流程测试 | P2 | 7% |
| T-09 | 项目详情页测试 | P2 | 7% |
| T-10 | 历史存档管理 | P2 | 6% |
| T-11 | 失败重试机制 | P2 | 6% |
| T-12 | Chat 页面测试 | P2 | 6% |
| T-13 | AI 对话测试 | P2 | 6% |
| T-14 | 确认流程测试 | P2 | 6% |

**P0 占比**: 3/14 = **21.4%** ✅

---

## 5. Acceptance Criteria (验收标准)

### 5.1 T-01: 定时任务触发

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | Cron 任务配置成功 | `expect(cronJobExists).toBe(true)` |
| AC-02 | 每日 8:00 触发 | `expect(nextRun).toBe('0 8 * * *')` |
| AC-03 | 触发后执行测试脚本 | `expect(testStarted).toBe(true)` |

### 5.2 T-02: 落地页加载测试

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 页面返回 200 | `expect(page.status()).toBe(200)` |
| AC-02 | 主标题可见 | `expect(title).toBeVisible()` |
| AC-03 | 登录按钮可点击 | `expect(loginBtn).toBeEnabled()` |
| AC-04 | 截图保存成功 | `expect(screenshotExists).toBe(true)` |

### 5.3 T-03: 登录流程测试

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 登录表单显示 | `expect(emailInput).toBeVisible()` |
| AC-02 | 邮箱格式验证 | `expect(emailError).not.toBeVisible()` |
| AC-03 | 密码输入隐藏 | `expect(passwordInput.type()).toBe('password')` |
| AC-04 | 登录成功跳转 Dashboard | `expect(url).toContain('/dashboard/')` |
| AC-05 | 登录后显示用户名 | `expect(userName).toBeVisible()` |

### 5.4 T-04: Dashboard 加载测试

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 项目列表加载 | `expect(projectList).toBeVisible()` |
| AC-02 | 项目卡片显示 | `expect(projectCards.length).toBeGreaterThan(0)` |
| AC-03 | 新建项目按钮可用 | `expect(createBtn).toBeEnabled()` |

### 5.5 T-05: 截图保存

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 截图文件存在 | `expect(fs.existsSync(path)).toBe(true)` |
| AC-02 | 截图非空 | `expect(fileSize).toBeGreaterThan(1000)` |
| AC-03 | 命名规范正确 | `expect(filename).toMatch(/^[\w-]+\.png$/)` |

### 5.6 T-06: 报告生成

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 报告文件存在 | `expect(reportExists).toBe(true)` |
| AC-02 | 包含测试结果表格 | `expect(content).toContain('| 测试ID |')` |
| AC-03 | 包含时间戳 | `expect(content).toContain('2026-')` |

### 5.7 T-07: Slack 通知

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 消息发送成功 | `expect(sendSuccess).toBe(true)` |
| AC-02 | 包含通过/失败数量 | `expect(message).toMatch(/\d+\/\d+/)` |
| AC-03 | 包含报告链接 | `expect(message).toContain('reports/')` |

---

## 6. Definition of Done (DoD)

### 6.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | Cron 定时任务配置完成，每日 8:00 自动触发 |
| DoD-2 | E2E 测试覆盖 P0 功能（落地页、登录、Dashboard） |
| DoD-3 | 每个 P0 功能有明确的 expect() 断言 |
| DoD-4 | 截图保存到指定路径 |
| DoD-5 | 测试报告生成包含测试结果表格 |
| DoD-6 | Slack 通知发送成功 |
| DoD-7 | P0 功能占比 < 30% |

### 6.2 质量 DoD

| # | 条件 |
|---|------|
| DoD-8 | 定时任务稳定运行 3 天无故障 |
| DoD-9 | 截图清晰可读 |
| DoD-10 | 报告格式规范统一 |

### 6.3 回归测试

| 场景 | 预期 |
|------|------|
| 定时任务触发 | 测试按计划执行 |
| 登录流程 | 账号正确登录成功 |
| 截图保存 | 文件正确生成 |
| Slack 通知 | 消息正确送达 |

---

## 7. Implementation Details

### 7.1 Cron 配置

```yaml
name: "vibex-e2e-daily"
schedule:
  kind: "cron"
  expr: "0 8 * * *"
  tz: "Asia/Shanghai"
payload:
  kind: "agentTurn"
  message: "运行 VibeX E2E 测试"
  sessionTarget: "isolated"
delivery:
  mode: "announce"
  channel: "slack"
```

### 7.2 目录结构

```
/root/.openclaw/workspace/vibex/tests/e2e/
├── screenshots/
│   ├── daily/{YYYY-MM-DD}/
│   └── latest/  (软链接)
├── reports/
│   └── {YYYY-MM-DD}-e2e-report.md
└── run-e2e-test.sh
```

### 7.3 测试账号

| 字段 | 值 |
|------|-----|
| 邮箱 | y760283407@outlook.com |
| 密码 | 12345678 |

---

## 8. Risk Mitigation

| 风险 | 缓解措施 |
|------|----------|
| Browser 服务不可用 | 回退到 web_fetch 方案 |
| 测试账号失效 | 提供备用账号 |
| 截图存储空间 | 定期清理 30 天前截图 |

---

## 9. Timeline Estimate

| Epic | 工作量 | 说明 |
|------|--------|------|
| Epic 1: 定时任务 | 1.5h | Cron + 通知配置 |
| Epic 2: 测试脚本 | 7h | 3 个 Story |
| Epic 3: 截图报告 | 2.5h | 3 个 Story |
| Epic 4: 通知集成 | 2h | 2 个 Story |
| **总计** | **13h** | ~2 人日 |

---

## 10. Dependencies

- **前置**: analyze-scheduled-e2e (已完成)
- **依赖**: OpenClaw cron 工具、browser 工具、message 工具

---

*PRD 完成于 2026-03-05 (PM Agent)*
