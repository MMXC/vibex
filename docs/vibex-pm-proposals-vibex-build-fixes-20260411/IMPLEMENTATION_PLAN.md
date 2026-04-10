# VibeX 产品体验优化 — 实施计划

**项目**: vibex-pm-proposals-vibex-build-fixes-20260411
**角色**: Architect
**日期**: 2026-04-11
**总工时**: ~40h
**Sprint 数量**: 2
**Sprint 周期**: 5 个工作日 / Sprint

---

## Sprint 概览

| Sprint | 主题 | Epic | 总工时 | 目标 |
|--------|------|------|--------|------|
| Sprint 1 | 基础安全 + 表单质量 | Epic 1 (部分), Epic 2, Epic 4, Epic 6 | ~20h | P1 全部解决，表单质量达标 |
| Sprint 2 | Canvas 增强 + 引导完善 | Epic 1 (完成), Epic 3, Epic 5 | ~20h | 体验增强全面上线 |

---

## Sprint 1（第 1-5 天）

### Epic 分配

| Epic | 工时 | 占比 |
|------|------|------|
| Epic 1: 安全与可靠性（Stories 1.2-1.5） | 6h | 30% |
| Epic 2: 导航与信息架构 | 4h | 20% |
| Epic 4: 表单与交互优化 | 10h | 50% |
| Epic 6: 体验清理 | 0.5h | — |

### Stories 详细计划

#### Day 1-2: Epic 1 安全增强（不含 1.1）

| Story | 工时 | 代码修改点 | 验收条件 |
|--------|------|-----------|----------|
| **1.2** AI 加载状态 | 2h | 新建 `components/generation-progress/` 目录<br>`GenerationProgress.tsx`：显示进度条、取消按钮<br>`design/[id]/page.tsx`：集成组件<br>`chat/page.tsx`：集成组件 | ✅ 所有含 AI 操作的页面有加载状态<br>✅ 取消按钮可终止进行中的请求 |
| **1.3** AI 错误友好化 | 1h | 新建 `lib/error-mapper.ts`：错误码 → 中文映射表<br>所有 API 调用处统一使用 error-mapper | ✅ 常见错误显示用户友好文案<br>✅ 未知错误有兜底文案 |
| **1.4** 删除确认 | 1h | `dashboard/components/` 新增 `ConfirmDialog.tsx`<br>`dashboard/page.tsx`：集成删除确认 Dialog | ✅ 删除操作触发二次确认<br>✅ Dialog 显示项目名称 |
| **1.5** 认证中间件 | 2h | 新建 `middleware.ts`（项目根目录）<br>拦截 `/dashboard` `/canvas` `/design` 等路径<br>`/auth` `/login` 放行 | ✅ 未登录访问受保护页返回 307<br>✅ `/auth` 页面本身可正常访问 |

**Day 1-2 验收**: ✅ P1 问题 1.2/1.3/1.4/1.5 全解决
- S1.2: GenerationProgress 组件完整（9/9 tests pass），设计页/聊天页可集成
- S1.3: error-mapper.ts HTTP状态码+正则模式→中文错误消息
- S1.4: dashboard ConfirmDialog 替换 window.confirm（删除/清空操作）
- S1.5: middleware.ts 认证中间件保护受保护路径

---

#### Day 3: Epic 2 导航优化

| Story | 工时 | 代码修改点 | 验收条件 |
|--------|------|-----------|----------|
| **2.1** Confirm 标注 | 0.5h | `app/confirm/page.tsx`：顶部添加 Banner（beta tag 或功能说明） | ✅ 页面顶部有功能说明标识 |
| **2.2** Settings mock 标注 | 0.5h | `app/project-settings/`：TODO mock 数据项添加「即将上线」标签 | ✅ 每个 mock 项有「即将上线」标注 |
| **2.3** 路由统一 | 1h | `app/page.tsx` 和 `app/homepage/page.tsx`：消除双重 redirect<br>`app/page.tsx`：直接指向 CanvasPage 或展示 landing | ✅ 访问 `/` 无双重 redirect<br>✅ redirectCount ≤ 1 |
| **2.4** Export 标注 | 0.5h | `app/export/page.tsx`：disabled 选项添加 disabled 属性 + tooltip | ✅ 不可用项 disabled 且有提示 |
| **2.5** 注册入口 | 1h | `app/auth/page.tsx`：添加「还没有账号？立即注册」切换链接<br>`app/auth/register/page.tsx`：添加登录切换 | ✅ 表单内无缝切换，无需 URL 参数 |

**Day 3 验收**: 所有导航 P2 问题已解决，路由链清晰

---

#### Day 4-5: Epic 4 表单优化

| Story | 工时 | 代码修改点 | 验收条件 |
|--------|------|-----------|----------|
| **4.1** 表单实时校验 | 2h | `auth/components/LoginForm.tsx`：邮箱正则校验（blur 时触发）<br>`auth/components/RegisterForm.tsx`：密码强度条（弱/中/强实时显示）<br>使用 `@vibex/types` 中的 Zod schema | ✅ 邮箱格式错误实时提示<br>✅ 密码强度可视化 |
| **4.2** 批量操作 | 4h | `dashboard/components/`：新增 `BatchToolbar.tsx`<br>`dashboard/page.tsx`：添加 Checkbox 多选逻辑<br>`BatchToolbar`：批量删除 + 批量移动按钮 | ✅ 可多选项目<br>✅ 批量操作有 toolbar 显示 |
| **4.3** Trash 体验 | 2h | `dashboard/components/`：Toast 通知（`react-hot-toast` 或自定义）<br>删除后显示「已移至回收站」<br>恢复入口：显示恢复目标选择 | ✅ 删除后有 Toast 反馈<br>✅ 可选择恢复目标 |
| **4.4** 样式迁移 | 2h | `app/auth/`：将所有 `style={...}` 内联样式迁移至 CSS Module<br>新建 `auth.module.css`，逐组件迁移 | ✅ Auth 页面无内联 React.CSSProperties<br>✅ 样式与迁移前一致 |

**Day 5 验收**: 表单校验在 dev/staging 验证，批量操作 E2E 测试通过，样式无退化

---

## Sprint 2（第 6-10 天）

### Epic 分配

| Epic | 工时 | 占比 |
|------|------|------|
| Epic 1: Story 1.1（权限后移） | 4h | 20% |
| Epic 3: Canvas 体验增强 | 10h | 50% |
| Epic 5: 新用户引导 | 6h | 30% |

### Stories 详细计划

#### Day 6: Epic 1.1 权限后移（高风险，需先行）

| Story | 工时 | 代码修改点 | 验收条件 |
|--------|------|-----------|----------|
| **1.1** 权限校验后移 | 4h | **后端**: `backend/src/auth/rbac.ts` 新建权限中间件<br>`backend/src/api/projects/` 所有端点添加权限检查<br>**前端**: `dashboard/page.tsx`：移除 `parseJWT` `ROLE_PERMISSIONS` 代码<br>`dashboard/components/`：所有权限相关 JS 代码移除 | ✅ 前端无 RBAC 代码（grep 验证）<br>✅ 后端高权限 API 返回 403<br>✅ `pnpm build` 前后端均成功 |

**部署顺序（关键）**:
1. 后端 API 先部署（权限中间件上线）
2. 前端同步部署（移除前端 RBAC）
3. 禁止同时部署 → 避免权限校验空窗

---

#### Day 7-8: Epic 3 Canvas 体验

| Story | 工时 | 代码修改点 | 验收条件 |
|--------|------|-----------|----------|
| **3.1** 引导 Overlay | 3h | `components/canvas/`：新建 `GuideOverlay.tsx`<br>`components/canvas/ShortcutPanel.tsx`（`?` 键触发）<br>`app/canvas/page.tsx`：首次访问检测（localStorage `hasSeenGuide`）<br>引导步骤：节点操作、三树联动、快捷键 | ✅ 首次进入 Canvas 展示引导<br>✅ `?` 键打开快捷键面板<br>✅ 引导可跳过 |
| **3.2** AI debounce | 1h | `hooks/useDebouncedAI.ts`：新建自定义 Hook<br>`design/[id]/page.tsx`：替换直接 API 调用<br>`chat/page.tsx`：替换直接 API 调用 | ✅ 输入停止 300ms 后才触发 AI<br>✅ 连续输入期间禁用提交 |
| **3.3** 版本透明化 | 2h | `components/canvas/SaveIndicator.tsx`：新建组件<br>`hooks/useSaveStatus.ts`：定时查询保存状态<br>`app/canvas/page.tsx`：集成 SaveIndicator | ✅ 显示「上次保存: X分钟前」<br>✅ 每 30s 刷新 |
| **3.4** 移动端手势 | 4h | `components/canvas/CanvasContainer.tsx`：集成 `@use-gesture/react`<br>双指缩放（pinch-zoom）<br>双击编辑节点<br>iOS Safari / Android Chrome 真机测试 | ✅ 双指缩放响应流畅<br>✅ 双击进入编辑模式<br>✅ 与桌面端拖拽无冲突 |

**Day 8 验收**: Canvas 所有增强功能在 mobile 模拟器 + 真机测试通过

---

#### Day 9-10: Epic 5 Onboarding + Epic 6 收尾

| Story | 工时 | 代码修改点 | 验收条件 |
|--------|------|-----------|----------|
| **5.1** Onboarding 流程 | 6h | `app/onboarding/page.tsx`：新路由入口<br>`components/onboarding/`：新建 StepWizard 组件<br>`components/onboarding/steps/`：<br>  - WelcomeStep（欢迎页）<br>  - CreateProjectStep（创建第一个项目）<br>  - CanvasIntroStep（三树概念介绍）<br>  - QuickStartStep（快捷键速览）<br>AuthContext：添加 `hasCompletedOnboarding` 标志 | ✅ 新用户首次登录进入引导<br>✅ 引导步骤 ≤ 5 步<br>✅ 完成后跳转 dashboard |
| **6.1** 延迟清理 | 0.5h | `app/flow/components/ProjectCreationStep.tsx`：移除纯等待 setTimeout<br>`app/flow/components/BusinessFlowStep.tsx`：移除纯等待 setTimeout<br>确认每个 setTimeout 用途（动画保留） | ✅ `grep` 验证无纯数字等待 setTimeout |

**Day 10 验收**: Onboarding 在 staging 可用，setTimeout 清理完成，项目整体 DoD 检查

---

## 验收条件汇总

### Sprint 1 验收标准

| 类别 | 条件 | 测试方式 |
|------|------|----------|
| P1 解决 | Story 1.2-1.5 所有 P1 问题已解决 | Playwright E2E |
| 表单质量 | Story 4.1 邮箱/密码校验工作正常 | Vitest unit |
| 批量操作 | Story 4.2 Checkbox 多选 + toolbar 可用 | Playwright E2E |
| 样式迁移 | Story 4.4 Auth 页面无内联样式 | ESLint rule |
| 路由清理 | Story 2.3 redirect chain ≤ 1 | Playwright network |
| CI | `pnpm build` + `pnpm test` 全绿 | GitHub Actions |

### Sprint 2 验收标准

| 类别 | 条件 | 测试方式 |
|------|------|----------|
| 权限后移 | Story 1.1 前端无 RBAC 代码，后端覆盖所有端点 | grep + API test |
| Canvas 增强 | Story 3.1-3.4 全部功能可用 | Playwright + 真机 |
| 移动端 | Story 3.4 手势在 iOS/Android 实测正常 | Device Farm / 真机 |
| Onboarding | Story 5.1 引导流程可完成 | Playwright E2E |
| 性能 | setTimeout 清理后无动画断裂 | Visual regression |
| 项目 DoD | 0 P1 遗留 + P2 覆盖率 ≥ 80% | 测试报告 |

---

## 部署策略

```
Week 1 (Sprint 1 结束时):
├── Staging 部署 → PM review → 批准
└── Production 部署（分批）
    ├── 5% 流量 (Canary)
    ├── 观察 30min
    └── 100% 流量

Week 2 (Sprint 2 结束时):
├── Staging 部署 → PM review → 批准
└── Production 部署
    ├── 特别注意 Story 1.1 权限迁移
    ├── 后端先上，前端后上
    └── Canary 观察延长至 1h
```

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID（待主 agent 绑定）
- **执行日期**: 2026-04-11
