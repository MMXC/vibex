# VibeX 产品体验优化 — PRD

**项目**: vibex-pm-proposals-vibex-build-fixes-20260411
**状态**: 已规划
**PM**: pm
**日期**: 2026-04-11
**产出**: `/root/.openclaw/vibex/docs/vibex-pm-proposals-vibex-build-fixes-20260411/prd.md`

---

## 1. 执行摘要

### 背景
VibeX 项目经过 PM 通读分析，发现 20 个产品体验问题，涵盖安全、交互流程、导航架构、错误处理、UI 一致性等多个维度。其中 P1 阻塞体验 5 个（影响发布），P2 影响效率 8 个（影响开发效率），P3 体验细节 7 个（优化体验）。

### 目标
通过系统化修复，将 VibeX 产品体验提升到可发布标准，消除阻塞性问题，完善用户引导和错误处理体系。

### 成功指标
- P1 问题全部解决（0 个遗留）
- P2 问题覆盖率 ≥ 80%
- 无硬编码人工延迟（setTimeout 纯粹等待）
- 路由入口统一，无重定向循环
- AI 操作有明确加载状态和错误提示

---

## 2. Epic 拆分

### Epic 1: 安全与可靠性

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | 权限校验后移至后端，移除前端 JWT 解码和 RBAC 逻辑 | 4h | - 前端 `dashboard/page.tsx` 不含 JWT 解码逻辑<br>- 后端 API 对高权限操作返回 403<br>- `expect(frontendRBACCode).toBe(null)` |
| **1.2** | AI 操作统一加载状态组件（`<GenerationProgress>`） | 2h | - `design/*/page.tsx` 含 `<GenerationProgress>` 或 Loading overlay<br>- 每个 AI 操作按钮提供「取消」选项<br>- `expect(hasLoadingState(aiButton)).toBe(true)` |
| **1.3** | AI 错误信息友好化：后端错误码→中文提示映射 | 1h | - 常见错误（配额/超时/模型不可用）映射为用户友好文案<br>- `expect(errorMessage).not.toContain('操作失败，请稍后重试')` |
| **1.4** | Dashboard 删除操作二次确认 Dialog | 1h | - 删除按钮点击后弹出 Dialog，展示项目名称<br>- `expect(hasConfirmDialog(deleteBtn)).toBe(true)` |
| **1.5** | Next.js Middleware 统一认证拦截 | 2h | - 未登录访问受保护页面在渲染前重定向<br>- `expect(unauthenticatedRequest.statusCode).toBe(307)` |

**Epic 1 总工时**: 10h

---

### Epic 2: 导航与信息架构

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **2.1** | /confirm 页面添加功能说明 banner | 30min | - 页面顶部有功能描述或 beta tag<br>- `expect(hasBanner(confirmPage)).toBe(true)` |
| **2.2** | Project Settings mock 数据标注「即将上线」 | 30min | - TODO 项显示「即将上线」标签或 beta banner<br>- `expect(mockDataLabel).toContain('即将上线')` |
| **2.3** | 路由入口统一：/ 重定向或直接指向 CanvasPage | 1h | - 仅保留一个首页入口，无双重 redirect<br>- `expect(redirectCount).toBeLessThanOrEqual(1)` |
| **2.4** | Export 页面不可用选项标注「即将推出」 | 30min | - 未实现功能 disabled + tooltip 提示<br>- `expect(unavailableOptions.disabled).toBe(true)` |
| **2.5** | Auth 页面注册入口优化：添加「立即注册」切换链接 | 1h | - 无需 URL 参数，表单内切换<br>- `expect(hasToggleLink(authPage)).toBe(true)` |

**Epic 2 总工时**: 3.5h

---

### Epic 3: Canvas 体验增强

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **3.1** | 三树联动引导 Overlay + 快捷键帮助 | 3h | - 首次进入 Canvas 展示引导说明<br>- `?` 键打开 ShortcutPanel<br>- `expect(hasGuideOverlay(canvas)).toBe(true)` |
| **3.2** | AI 输入 debounce（300ms）| 1h | - 输入框连续输入期间禁用提交<br>- `expect(debounceMs).toBeGreaterThanOrEqual(300)` |
| **3.3** | 版本历史透明化：VersionHistoryPanel + SaveIndicator | 2h | - SaveIndicator 显示「上次保存: X分钟前」<br>- `expect(saveIndicator.visible).toBe(true)` |
| **3.4** | Canvas 移动端手势支持（捏合缩放） | 4h | - 移动端支持双指缩放、双击编辑节点<br>- `expect(hasGestures(canvasMobile)).toBe(true)` |

**Epic 3 总工时**: 10h

---

### Epic 4: 表单与交互优化

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **4.1** | Auth 表单实时格式校验 + 密码强度指示 | 2h | - 邮箱正则校验、密码强度条（弱/中/强）<br>- `expect(validationEnabled).toBe(true)` |
| **4.2** | Dashboard 批量操作（多选+批量移动/删除） | 4h | - Checkbox 多选 + 批量 Toolbar<br>- `expect(hasBatchToolbar(dashboard)).toBe(true)` |
| **4.3** | Trash 删除后 Toast + 恢复目标选择 | 2h | - 删除后显示「已移至回收站」Toast<br>- `expect(hasDeleteToast).toBe(true)` |
| **4.4** | Auth 页面内联样式迁移至 CSS Module | 2h | - `inputStyle` 等内联 `React.CSSProperties` 迁移至 module.css<br>- `expect(inlineStyleCount).toBe(0)` |

**Epic 4 总工时**: 10h

---

### Epic 5: 新用户引导

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **5.1** | Onboarding 流程完整实现 | 6h | - 新用户首次登录进入引导流<br>- 引导步骤覆盖：创建项目、三树概念、快速上手<br>- `expect(hasOnboardingFlow).toBe(true)` |

**Epic 5 总工时**: 6h

---

### Epic 6: 体验清理

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **6.1** | 移除人工 setTimeout 延迟 | 30min | - `ProjectCreationStep.tsx` 和 `BusinessFlowStep.tsx` 中无纯等待 setTimeout<br>- `expect(pureWaitTimers).toBe(0)` |

**Epic 6 总工时**: 30min

---

**总工时汇总**: 10 + 3.5 + 10 + 10 + 6 + 0.5 = **40h**（建议 2-3 个 Sprint）

---

## 3. 验收标准（Epic 1 Detail）

### Story 1.1 — 权限后移

```
expect(document.querySelector('[data-rbac]')).toBeNull()
// 或: frontend RBAC 相关代码行数 = 0
expect(exec('grep -rn "ROLE_PERMISSIONS\\|parseJWT.*role" vibex-fronted/src/app/dashboard/').exitCode).toBe(2)
expect(exec('cd vibex-backend && pnpm build').exitCode).toBe(0)
```

### Story 1.2 — AI 加载状态

```
expect(exists('vibex-fronted/src/components/generation-progress/')).toBe(true)
expect(exec('grep -l "GenerationProgress\\|LoadingOverlay" vibex-fronted/src/app/design/*/page.tsx').count).toBeGreaterThan(0)
```

### Story 1.4 — 删除确认

```
expect(exists('[data-confirm-dialog]')).toBe(true)
// 或通过 Cypress/Playwright: 点击删除按钮 → 出现 Dialog
```

---

## 4. DoD (Definition of Done)

每个 Epic 完成需满足：

- [ ] Epic 内所有 Story 验收标准通过
- [ ] `pnpm build`（前后端）均成功
- [ ] `pnpm test` 均通过
- [ ] 代码无新 eslint error
- [ ] 相关文档（changelog）已更新

**项目整体 DoD**:
- [ ] 0 个 P1 问题遗留
- [ ] P2 问题覆盖率 ≥ 80%
- [ ] 所有人工延迟 setTimeout 已清理
- [ ] 路由入口统一

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 权限后移 | JWT 解码/权限判断移至后端 | `expect(frontendRBACCode).toBe(null)` | ✅ dashboard |
| F1.2 | AI加载状态 | 统一 GenerationProgress + 取消按钮 | `expect(hasLoadingState(aiBtn)).toBe(true)` | ✅ design/*, chat |
| F1.3 | AI错误友好化 | 错误码→中文映射 | `expect(friendlyError).toBe(true)` | ✅ 全局 |
| F1.4 | 删除确认 | Confirm Dialog | `expect(hasConfirmDialog).toBe(true)` | ✅ dashboard |
| F1.5 | 认证中间件 | Next.js Middleware | `expect(statusCode).toBe(307)` | ✅ 全局 |
| F2.1 | Confirm标注 | 功能说明 banner | `expect(hasBanner).toBe(true)` | ✅ /confirm |
| F2.2 | Settings mock | 即将上线标注 | `expect(mockLabel).toContain('即将上线')` | ✅ /project-settings |
| F2.3 | 路由统一 | 单一首页入口 | `expect(redirectCount).toBe(0)` | ✅ / |
| F2.4 | Export标注 | 即将推出 disabled | `expect(disabled).toBe(true)` | ✅ /export |
| F2.5 | 注册入口 | 切换链接 | `expect(hasToggleLink).toBe(true)` | ✅ /auth |
| F3.1 | Canvas引导 | Overlay + ShortcutPanel | `expect(hasGuideOverlay).toBe(true)` | ✅ /canvas |
| F3.2 | AI debounce | 300ms 防抖 | `expect(debounceMs).toBe(300)` | ✅ design/*, chat |
| F3.3 | 版本透明化 | 保存时间显示 | `expect(saveIndicator.visible).toBe(true)` | ✅ /canvas |
| F3.4 | 移动端手势 | 捏合缩放等 | `expect(hasGestures).toBe(true)` | ✅ /canvas |
| F4.1 | 表单校验 | 实时格式+强度条 | `expect(validationEnabled).toBe(true)` | ✅ /auth |
| F4.2 | 批量操作 | 多选+Toolbar | `expect(hasBatchToolbar).toBe(true)` | ✅ /dashboard |
| F4.3 | Trash体验 | Toast+恢复目标 | `expect(hasDeleteToast).toBe(true)` | ✅ /dashboard |
| F4.4 | 样式迁移 | CSS Module 化 | `expect(inlineStyleCount).toBe(0)` | ✅ /auth |
| F5.1 | Onboarding | 完整引导流程 | `expect(hasOnboardingFlow).toBe(true)` | ✅ /onboarding |
| F6.1 | 延迟清理 | 无人工 setTimeout | `expect(pureWaitTimers).toBe(0)` | ✅ flow-project, flow-business |

---

## 6. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点汇总表格式正确（ID/描述/验收标准/页面集成）
- [x] 已执行 Planning（Feature List 已产出）

---

*Planning 输出: `plan/feature-list.md`*  
*基于 PM 提案: `pm-proposals.md`（20个问题，20个功能点）*
