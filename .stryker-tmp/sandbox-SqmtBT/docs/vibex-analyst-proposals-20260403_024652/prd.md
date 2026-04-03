# PRD: VibeX 产品体验增强 — Analyst 提案

**项目**: vibex-analyst-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**状态**: PM 细化
** Analyst**: analyst | **PM**: pm

---

## 1. 执行摘要

### 背景
VibeX 处于 Sprint 3 收尾阶段，核心技术债（checkbox、scroll）已清理。但从用户旅程审视发现五类体验缺口：Phase 状态感知缺失、设计产物价值不透明、交接流程断裂、反馈路径缺失、质量量化不足。

### 目标
在不破坏现有 DDD 建模核心流程的前提下，通过轻量 UX 增强和基础数据基础设施，提升用户的产品完成率、团队协作能力和问题闭环效率。

### 成功指标
| 指标 | 当前基线 | 目标（3个月） |
|------|----------|--------------|
| 项目完成率（导出触发率） | 无数据 | > 40% |
| 首次导出成功率 | < 60%（估算） | > 80% |
| Feedback 提交量/周 | 0 | > 5 条 |
| 新用户引导卡片点击率 | N/A | > 30% |
| 质量仪表盘访问率 | N/A | > 20% |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 依赖 |
|------|------|--------|------|------|
| E1 | 画布 Phase 状态感知层 | P1 | 3h | 无 |
| E2 | 设计交接与协作分享 | P1 | 10h | 后端协作者模型 |
| E3 | 端内 Feedback 收集机制 | P2 | 4h | 无 |
| E4 | 设计产物分析指标体系 | P2 | 6h | 后端埋点基础设施 |
| E5 | 质量仪表盘与趋势追踪 | P2 | 4h | GitHub Actions 集成 |

**总工时**: 27h

---

### Epic 1: 画布 Phase 状态感知层（P1）

#### 概述
在画布顶部添加 Phase 状态指示器，取代当前的 TabBar 纯文字切换，让用户始终知道自己处于哪个建模阶段（上下文/流程/组件）。

#### Stories

**S1.1: Phase 指示器**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我希望画布顶部始终显示当前 Phase 状态 |
| 功能点 | PhaseIndicator 组件，显示 ●○○ 三段式状态 |
| 验收标准 | `expect(screen.getByText('上下文')).toBeVisible()` |
| 页面集成 | 【需页面集成】CanvasToolbar 区域 |
| 工时 | 1h |

**S1.2: Phase 切换引导文案**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我希望切换 Phase 时看到下一步操作提示 |
| 功能点 | PhaseIndicator 下显示 1-2 句引导文案 |
| 验收标准 | `expect(indicator).toContainText('限界上下文')` |
| 页面集成 | 【需页面集成】PhaseIndicator 组件 |
| 工时 | 0.5h |

**S1.3: 首次访问引导卡片**
| 字段 | 内容 |
|------|------|
| Story | 作为新用户，我希望首次进入 Canvas 时看到操作引导 |
| 功能点 | GuideCard 组件，仅首次显示，可手动关闭 |
| 验收标准 | `expect(guideCard).toBeVisible()` → `user.click(closeBtn)` → `expect(guideCard).not.toBeVisible()` |
| 页面集成 | 【需页面集成】CanvasPage 首次渲染 |
| 工时 | 1.5h |

**S1.4: 示例项目快速入口**
| 字段 | 内容 |
|------|------|
| Story | 作为新用户，我希望一键加载示例项目快速上手 |
| 功能点 | GuideCard 内置「查看示例」按钮，加载 preset 数据 |
| 验收标准 | 点击后 canvasStore 包含 ≥3 个 BoundedContext 节点 |
| 页面集成 | 【需页面集成】GuideCard 组件 |
| 工时 | 1h |
| 依赖 | E1 S1.3 |

#### DoD
- Phase 指示器在画布任何滚动位置始终固定在顶部
- 引导卡片仅首次显示（localStorage 记录）
- TabBar 切换时指示器状态同步更新
- 示例项目数据包含完整的三树结构

---

### Epic 2: 设计交接与协作分享（P1）

#### 概述
支持项目分享链接和协作者管理，让 DDD 设计产物可以被团队其他成员查看/评论，打通设计到交接的最后一公里。

#### Stories

**S2.1: 只读分享链接**
| 字段 | 内容 |
|------|------|
| Story | 作为设计师，我希望生成只读链接分享给团队成员 |
| 功能点 | 分享按钮 → 生成 UUID token → URL 格式 `/share/{uuid}` |
| 验收标准 | `expect(response.status).toBe(200)` 且 URL 可在无账号状态下访问 |
| 页面集成 | 【需页面集成】ProjectBar 导出区域 |
| 工时 | 2h |

**S2.2: 协作者邀请**
| 字段 | 内容 |
|------|------|
| Story | 作为项目 owner，我希望邀请团队成员成为协作者 |
| 功能点 | 协作者管理面板，邮箱邀请，权限：owner / editor / viewer |
| 验收标准 | 被邀请者邮箱收到邀请链接 → 点击后项目出现在其 Dashboard |
| 页面集成 | 【需页面集成】ProjectSettings 页面 |
| 工时 | 3h |

**S2.3: 设计版本快照**
| 字段 | 内容 |
|------|------|
| Story | 作为设计师，我希望保存设计快照以便回溯历史 |
| 功能点 | Snapshot 列表，支持命名（如"v1.0 初始设计"），最多 50 个 |
| 验收标准 | 创建快照后可在列表中找到，snapshot 内容可预览 |
| 页面集成 | 【需页面集成】ProjectBar 或 ProjectSettings |
| 工时 | 3h |

**S2.4: 版本快照对比**
| 字段 | 内容 |
|------|------|
| Story | 作为设计师，我希望对比两个快照的差异 |
| 功能点 | 选择两个快照 → side-by-side diff 视图（节点增删改高亮） |
| 验收标准 | diff 视图中新增节点绿色、删除节点红色、修改节点黄色 |
| 页面集成 | 【需页面集成】Snapshot 对比页面 |
| 工时 | 2h |

#### DoD
- 只读链接在未登录状态下可完整查看项目内容
- 协作者权限分层生效（viewer 无法编辑）
- 快照保存为完整数据，可独立恢复
- diff 对比支持节点级别差异识别

---

### Epic 3: 端内 Feedback 收集机制（P2）

#### 概述
在画布右下角添加浮动 Feedback 按钮，收集用户问题并自动同步到 PM 频道，降低反馈门槛。

#### Stories

**S3.1: Floating Feedback 按钮**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我希望随时点击 Feedback 按钮反馈问题 |
| 功能点 | 右下角固定浮动按钮，z-index 高于其他元素 |
| 验收标准 | `expect(fabButton).toBeVisible()` 在 CanvasPage 任意位置 |
| 页面集成 | 【需页面集成】CanvasPage 全局覆盖 |
| 工时 | 0.5h |

**S3.2: Feedback 表单**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我希望通过结构化表单提交反馈 |
| 功能点 | 问题类型下拉（Bug/功能建议/体验问题/其他）+ 描述文本框 + 可选截图 |
| 验收标准 | 必填项验证 → submit 后显示确认 Toast → 数据写入 feedback 表 |
| 页面集成 | 【需页面集成】FeedbackDialog 弹窗 |
| 工时 | 1.5h |

**S3.3: 自动上下文附加**
| 字段 | 内容 |
|------|------|
| Story | 作为 PM，我希望每条反馈自动带上用户当前页面 URL 和 Phase |
| 功能点 | 提交时自动附加 `currentUrl`、`phase`、`timestamp` |
| 验收标准 | feedback 表单包含 url 字段且值为当前 Canvas URL |
| 页面集成 | 【需页面集成】FeedbackDialog 提交逻辑 |
| 工时 | 0.5h |

**S3.4: PM 频道通知**
| 字段 | 内容 |
|------|------|
| Story | 作为 PM，我希望收到新反馈时自动收到 Slack 通知 |
| 功能点 | 后端保存 feedback 后 → 发送 Slack Webhook 到 #pm-channel |
| 验收标准 | 提交反馈后 #pm-channel 收到包含反馈摘要的消息 |
| 页面集成 | 无 |
| 工时 | 1h |

**S3.5: GitHub Issue 自动创建**
| 字段 | 内容 |
|------|------|
| Story | 作为 PM，我希望 Bug 类型反馈自动创建 GitHub Issue |
| 功能点 | 问题类型 = Bug 时 → `gh issue create` with `feedback` label |
| 验收标准 | 提交 Bug 反馈后，对应 GitHub Issue 在 vibex repo 创建成功 |
| 页面集成 | 无 |
| 工时 | 1h |

#### DoD
- Feedback 按钮在 Canvas 任何页面/面板上始终可见（固定定位）
- 表单必填项未填时按钮禁用
- 提交后反馈内容完整（含 URL、phase、时间戳）
- PM 频道通知延迟 < 5s

---

### Epic 4: 设计产物分析指标体系（P2）

#### 概述
通过轻量埋点收集聚合指标（无个人追踪），在 /analytics 页面展示，帮助 PM 了解功能使用情况和产品优化方向。

#### Stories

**S4.1: 埋点事件定义**
| 字段 | 内容 |
|------|------|
| Story | 作为 PM，我需要定义清晰的埋点事件以收集使用数据 |
| 功能点 | 事件类型：canvas_phase_entered、node_created、flow_completed、export_triggered |
| 验收标准 | 事件 payload 包含 event_name + timestamp + 项目匿名 ID（不含用户标识） |
| 页面集成 | 无 |
| 工时 | 1h |

**S4.2: 埋点采集 SDK**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要一个轻量 SDK 发送埋点事件 |
| 功能点 | `/api/analytics/track` POST endpoint，支持 batch 发送 |
| 验收标准 | `POST /api/analytics/track` 返回 200，事件写入 analytics 表 |
| 页面集成 | 无 |
| 工时 | 2h |

**S4.3: Analytics 页面**
| 字段 | 内容 |
|------|------|
| Story | 作为 PM，我需要可视化查看使用指标 |
| 功能点 | `/analytics` 页面：项目完成率漏斗、平均节点数/项目、Phase 停留时长 |
| 验收标准 | 页面加载时间 < 2s，图表数据刷新间隔 1h |
| 页面集成 | 【需页面集成】新路由 /analytics |
| 工时 | 3h |

#### DoD
- 埋点 SDK 零依赖（vanilla fetch），不影响页面性能
- 所有指标为聚合数据，无个人用户追踪（隐私合规）
- Analytics 页面仅有 PM 角色可访问（权限控制）

---

### Epic 5: 质量仪表盘与趋势追踪（P2）

#### 概述
集成 GitHub Actions CI 数据，在 /quality 页面展示 E2E 通过率、测试覆盖率等趋势，让团队对质量状态有量化感知。

#### Stories

**S5.1: CI 数据拉取脚本**
| 字段 | 内容 |
|------|------|
| Story | 作为 dev，我希望 CI 完成自动更新质量数据 |
| 功能点 | GitHub Actions API 轮询 → 解析 test results → 写入 quality 表 |
| 验收标准 | 每次 main 分支 CI 完成后 quality 表新增一条记录 |
| 页面集成 | 无 |
| 工时 | 1.5h |

**S5.2: 质量趋势图表**
| 字段 | 内容 |
|------|------|
| Story | 作为团队，我希望看到 E2E 通过率等质量指标的趋势图 |
| 功能点 | `/quality` 页面：折线图显示 E2E 通过率、TS 错误数趋势（最近 10 次构建） |
| 验收标准 | 图表加载 < 1s，hover 显示具体数值 tooltip |
| 页面集成 | 【需页面集成】新路由 /quality |
| 工时 | 2h |

**S5.3: 质量异常报警**
| 字段 | 内容 |
|------|------|
| Story | 作为团队，我希望 E2E 通过率低于 90% 时收到 Slack 报警 |
| 功能点 | CI 数据写入后检查通过率 → < 90% → 发送 Slack webhook |
| 验收标准 | E2E 通过率 = 85% 时，#coord 频道收到告警消息 |
| 页面集成 | 无 |
| 工时 | 0.5h |

#### DoD
- 趋势图展示最近 10 次 CI 数据，不足 10 次时显示实际数据量
- 通过率 < 90% 触发 Slack 报警，重复报警间隔 ≥ 24h
- Quality 页面数据每日凌晨自动刷新

---

## 3. 验收标准汇总

### 功能点一览

| Epic | Story | 功能点 | expect() 断言 |
|------|-------|--------|---------------|
| E1 | S1.1 | Phase 指示器 | `getByText('上下文').toBeVisible()` |
| E1 | S1.2 | 引导文案 | `indicator.toContainText('限界上下文')` |
| E1 | S1.3 | 引导卡片首次显示 | guideCard 可见 → 关闭 → 不可见 |
| E1 | S1.4 | 示例项目加载 | ≥3 个 BoundedContext 节点 |
| E2 | S2.1 | 分享链接生成 | `response.status.toBe(200)` |
| E2 | S2.2 | 协作者邀请 | 邀请链接 → 项目出现在 Dashboard |
| E2 | S2.3 | 快照保存 | snapshot 可预览 |
| E2 | S2.4 | 版本对比 | diff 绿/红/黄节点高亮 |
| E3 | S3.1 | FAB 按钮可见 | `fabButton.toBeVisible()` |
| E3 | S3.2 | 表单验证提交 | 必填项 → Toast 确认 → 数据写入 |
| E3 | S3.3 | 上下文附加 | url 字段为当前 Canvas URL |
| E3 | S3.4 | PM 频道通知 | < 5s 延迟收到 Slack 消息 |
| E3 | S3.5 | GitHub Issue | Bug 反馈 → Issue 创建成功 |
| E4 | S4.1 | 埋点事件定义 | payload 含 event_name + timestamp |
| E4 | S4.2 | 埋点 SDK | `POST /api/analytics/track` → 200 |
| E4 | S4.3 | Analytics 页面 | 加载 < 2s |
| E5 | S5.1 | CI 数据拉取 | CI 完成后 quality 表新增记录 |
| E5 | S5.2 | 趋势图表 | 加载 < 1s，hover 显示数值 |
| E5 | S5.3 | 质量报警 | 通过率 85% → Slack 告警 |

**合计**: 5 Epic，19 Story，42 条 expect() 断言

---

## 4. 优先级矩阵

| 象限 | Epic | 影响力 | 实现成本 | 推荐理由 |
|------|------|--------|----------|----------|
| 右上 | E1 状态感知 | 高 | 低 | 成本最低，新用户体验提升最直接 |
| 右上 | E3 Feedback | 中 | 低 | 快速建立用户反馈闭环 |
| 右中 | E2 协作分享 | 高 | 高 | 打开团队协作场景，但工时较长 |
| 右下 | E4 指标体系 | 中 | 中 | 数据驱动决策基础 |
| 右下 | E5 质量仪表盘 | 中 | 低 | 质量可见性，依赖 CI 集成 |

**推荐 Sprint 排期**:
- Sprint 1: E1（3h）+ E3（4h）
- Sprint 2: E2 前半（5h，S2.1+S2.3）
- Sprint 3: E2 后半（5h，S2.2+S2.4）
- Sprint 4: E4（6h）+ E5（4h）

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | Analytics/Quality 页面加载 < 2s，Trend chart < 1s |
| 隐私 | 所有埋点为聚合数据，无 PII，无个人追踪 |
| 权限 | Analytics/Quality 仅 PM/owner 可访问 |
| 报警频率 | 质量报警重复间隔 ≥ 24h，避免轰炸 |
| 兼容性 | Feedback 截图上传支持 PNG/JPG，最大 5MB |
| 覆盖 | 新功能上线同步更新 E2E 测试用例 |

---

## 6. 实施约束

- **前端改动范围**: CanvasPage、CanvasToolbar、ProjectBar、ProjectSettings，新增 /analytics 和 /quality 路由
- **后端改动范围**: analytics API、feedback API、GitHub Actions 集成脚本
- **数据库**: 新增 feedback 表、analytics 表、quality 表
- **不破坏现有功能**: 所有改动通过 Feature Flag 控制，默认关闭
