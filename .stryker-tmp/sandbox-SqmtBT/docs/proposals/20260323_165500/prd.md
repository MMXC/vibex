# PRD: vibex-homepage-api-alignment — 首页卡片树设计 + API 对接

**状态**: Draft  
**版本**: 1.0  
**日期**: 2026-03-23  
**PM**: PM Agent  
**目标**: 首页画布改为卡片树（Card Tree）布局，对接后端 API

---

## 1. 执行摘要

### 背景
VibeX 首页作为用户入口，需展示项目/模板的层次关系。现有 Grid 布局无法表达父子层级。

### 目标
- 将首页 Grid 布局改为卡片树（Card Tree）布局
- 对接后端 API 获取数据
- 支持折叠/展开树节点

### 关键指标
| 指标 | 目标 |
|------|------|
| 首页加载时间 | < 2s（含 API 请求）|
| npm test 通过率 | ≥ 99% |
| 卡片树层级深度 | 支持 2 层（可折叠）|
| API 错误降级 | 显示友好提示 + 重试按钮 |

---

## 2. Epic 拆分

### Epic 1: 数据层 — API Hook 实现
**目标**: 创建 `useProjectTree` Hook，对接后端 API

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S1.1 | 创建 `useProjectTree` Hook | ✅ `expect(typeof useProjectTree).toBe('function')` |
| S1.2 | 支持 `GET /api/projects` 请求 | ✅ `expect(hook.data).toBeTruthy()` |
| S1.3 | 支持 `isLoading` 状态 | ✅ `expect(hook.isLoading).toBe(false)` |
| S1.4 | 支持 `error` 状态 | ✅ `expect(() => { throw hook.error }).toThrow()` |
| S1.5 | Mock data 降级（API 未就绪时）| ✅ `expect(mockData).toBeTruthy()` |
| S1.6 | TypeScript 类型完整 | ✅ `tsc --noEmit` 退出码 0 |

**DoD**: Hook 可独立使用，API 未就绪时 fallback 到 mock。

---

### Epic 2: 卡片树布局 — UI 实现
**目标**: 将 Grid 布局改为卡片树布局，保持视觉一致

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S2.1 | 卡片树组件 `CardTree` 渲染 | ✅ `expect(screen.queryByTestId('card-tree')).toBeTruthy()` |
| S2.2 | 父子卡片正确缩进（子节点 +16px）| ✅ Playwright E2E 截图对比 |
| S2.3 | 卡片树节点可折叠/展开 | ✅ `expect(collapsedChild).not.toBeVisible()` |
| S2.4 | 卡片内容与 Grid 版本一致（标题/描述/图标）| ✅ 截图对比测试 |
| S2.5 | 折叠按钮可访问（键盘 + 屏幕阅读器）| ✅ Playwright accessibility 测试 |
| S2.6 | 移动端响应式（单列展示）| ✅ Playwright 移动端测试 |

**DoD**: 卡片树渲染正确，层级关系清晰，截图对比通过。 【需页面集成】

---

### Epic 3: 首页集成
**目标**: 将卡片树组件集成到首页，替换现有 Grid 布局

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S3.1 | 首页 `page.tsx` 渲染 `CardTree` 组件 | ✅ `expect(screen.queryByTestId('homepage-card-tree')).toBeTruthy()` |
| S3.2 | 页面加载顺序：骨架屏 → 卡片树 | ✅ Playwright E2E 验证加载顺序 |
| S3.3 | API 数据正确传入卡片树 | ✅ `expect(screen.queryByText(projectName)).toBeTruthy()` |
| S3.4 | Feature Flag 控制新旧布局切换 | ✅ `expect(useFeatureFlag('CARD_TREE')).toBe(true)` |
| S3.5 | 旧 Grid 布局保留（Feature Flag off 时）| ✅ `expect(screen.queryByTestId('grid-layout')).toBeTruthy()` |

**DoD**: 首页集成完成，Feature Flag 控制新旧布局。 【需页面集成】

---

### Epic 4: 错误处理与降级
**目标**: API 失败时优雅降级，不阻塞用户

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S4.1 | API 错误时显示错误提示卡片 | ✅ `expect(screen.queryByText(/加载失败/i)).toBeTruthy()` |
| S4.2 | 错误提示包含重试按钮 | ✅ `expect(screen.queryByRole('button', { name: /重试/i })).toBeTruthy()` |
| S4.3 | 点击重试后重新请求 API | ✅ E2E 模拟网络错误 + 重试验证 |
| S4.4 | 网络超时（> 10s）显示超时提示 | ✅ `expect(screen.queryByText(/请求超时/i)).toBeTruthy()` |

**DoD**: 所有 API 异常场景有友好降级。 【需页面集成】

---

### Epic 5: 性能优化
**目标**: 确保卡片树渲染性能达标

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S5.1 | 50 个卡片首次渲染 < 1s | ✅ Playwright Performance API |
| S5.2 | 折叠/展开动画流畅（60fps）| ✅ Chrome DevTools 验证 |
| S5.3 | 懒加载非首屏卡片 | ✅ `IntersectionObserver` 验证 |

**DoD**: 性能指标全部达标。

---

## 3. 验收标准（expect 断言格式）

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | Dev server running | GET `/` | `expect(response.status).toBe(200)` |
| AC-2 | CardTree component | render | `expect(screen.queryByTestId('card-tree')).toBeTruthy()` |
| AC-3 | API loading | page load | `expect(screen.queryByTestId('skeleton')).toBeTruthy()` |
| AC-4 | API error | 500 response | `expect(screen.queryByText(/加载失败/i)).toBeTruthy()` |
| AC-5 | Child card | collapsed | `expect(child.isNotVisible())` |
| AC-6 | Feature Flag off | render | `expect(screen.queryByTestId('grid-layout')).toBeTruthy()` |
| AC-7 | 50 cards | render | `expect(firstCardVisible).toBe(true) && renderTime < 1000` |

---

## 4. 非功能需求

| 类别 | 要求 |
|------|------|
| **性能** | 首屏加载 < 2s，50 卡片渲染 < 1s |
| **可访问性** | 键盘导航 + ARIA 标签 |
| **可测试性** | 单元测试覆盖 ≥ 90% |
| **向后兼容** | Feature Flag 控制，回滚无数据损失 |

---

## 5. 实施计划

| 阶段 | 内容 | 负责 |
|------|------|------|
| Phase 1 | Epic 1: useProjectTree Hook | Dev |
| Phase 2 | Epic 2: CardTree 组件 | Dev |
| Phase 3 | Epic 3: 首页集成 + Feature Flag | Dev |
| Phase 4 | Epic 4: 错误处理 + 降级 | Dev |
| Phase 5 | Epic 5: 性能调优 | Dev |
| Phase 6 | E2E + 截图对比测试 | Tester |
| Phase 7 | PM 验收 | PM |

---

## 6. 风险与缓解

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| 后端 API 未就绪 | 高 | 中 | Mock data 降级，API 就绪后切换 |
| 卡片树性能问题 | 中 | 低 | 虚拟列表 + 按需渲染 |
| 树形交互复杂化 | 中 | 中 | 保持简单，折叠仅 2 层 |
| Feature Flag 覆盖不完整 | 中 | 低 | 灰度验证 + A/B 测试 |

---

*PRD v1.0 — 2026-03-23*
