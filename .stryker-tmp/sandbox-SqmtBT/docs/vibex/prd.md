# PRD: homepage-theme-api-analysis

> **项目**: homepage-theme-api-analysis  
> **版本**: 1.0  
> **日期**: 2026-03-21  
> **负责人**: PM Agent  
> **状态**: ✅ PRD 完成

---

## 1. 执行摘要

**背景**: 首页需支持主题切换（深色/浅色模式）并实现 API 数据绑定，提升用户体验和系统可维护性。

**目标**: 实现主题自由切换 + API 数据清晰绑定

**关键指标**:
- 功能点: 6 个（Epic 3 / Story 6）
- 预估工时: 8 人日
- 验收通过率: 100%

---

## 2. Epic 拆分

### Epic 1: 主题状态管理
**优先级**: P1 — 核心功能

| Story ID | 描述 | 验收标准 | DoD |
|----------|------|----------|-----|
| ST-1.1 | 主题 Context 实现 | `expect(ThemeContext).toBeDefined()` | ThemeContext 存在且导出正确 |
| ST-1.2 | 主题切换逻辑 | `expect(toggleTheme).toBeDefined()` | toggleTheme 函数可调用 |
| ST-1.3 | 主题状态类型定义 | `expect(Theme).toBeDefined()` | `'light' \| 'dark' \| 'system'` 类型存在 |

**DoD**:
- `src/contexts/ThemeContext.tsx` 存在
- `useTheme()` hook 可被 import
- 主题状态包含 `theme` 和 `toggleTheme`

---

### Epic 2: 主题持久化与同步
**优先级**: P1 — 用户体验关键

| Story ID | 描述 | 验收标准 | DoD |
|----------|------|----------|-----|
| ST-2.1 | localStorage 持久化 | 刷新后 `theme` 保持 | `expect(localStorage.getItem('theme')).toBeTruthy()` |
| ST-2.2 | 主题同步到多组件 | 各组件主题一致 | 集成测试验证 |
| ST-2.3 | 系统主题跟随 | OS 主题变化时自动切换 | 模拟 `prefers-color-scheme` 变化 |

**DoD**:
- 刷新页面后主题不变
- 任意组件内 `useTheme()` 返回一致值
- `window.matchMedia` 监听正确工作

---

### Epic 3: API 数据绑定
**优先级**: P1 — 核心需求

| Story ID | 描述 | 验收标准 | DoD |
|----------|------|----------|-----|
| ST-3.1 | API 返回主题配置 | `expect(theme).toBe('light' \| 'dark' \| 'system')` | API 响应格式正确 |
| ST-3.2 | API 数据与本地合并 | 本地偏好优先，API 提供默认值 | 合并逻辑测试通过 |
| ST-3.3 | API 请求可追踪 | 网络请求日志存在 | 调试日志可见 |

**DoD**:
- `GET /api/v1/homepage` 响应正确解析
- 本地 `localStorage` 优先级高于 API
- DevTools Network 面板可见请求

---

## 3. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC-01 | 用户点击切换按钮 | 任意时刻 | 主题立即变化，响应 < 100ms |
| AC-02 | 用户刷新页面 | 已有主题偏好 | 主题保持不变 |
| AC-03 | API 返回数据 | 首页加载 | `theme` 字段正确解析 |
| AC-04 | 组件渲染 | 任意主题下 | 样式正确应用，无闪烁 |
| AC-05 | OS 主题变化 | 系统主题切换 | 页面主题跟随（system 模式） |
| AC-06 | localStorage 无数据 | 首次访问 | 使用 API 默认值或 `system` |

---

## 4. 回归测试

| ID | 描述 | 预期 |
|----|------|------|
| RG-1 | 原有功能不受影响 | 无主题相关功能的页面正常 |
| RG-2 | API 不可用降级 | 使用本地默认主题 |
| RG-3 | localStorage 损坏容错 | 降级到 system 主题 |

---

## 5. 非功能需求

- **性能**: 主题切换响应 < 100ms，无重排
- **可访问性**: 颜色对比度符合 WCAG AA
- **兼容性**: 支持 Chrome/Firefox/Safari 最新版
- **代码质量**: TypeScript 类型完整，无 `any`

---

## 6. 技术约束

- 使用 CSS 变量定义主题颜色（方案A）
- React Context 管理状态
- localStorage 持久化
- 主题字段: `'light' | 'dark' | 'system'`

---

## 7. 依赖

| 依赖 | 来源 | 说明 |
|------|------|------|
| React Context | 现有依赖 | 状态管理 |
| localStorage | Web API | 持久化 |
| window.matchMedia | Web API | 系统主题监听 |

---

## 8. 实施计划

| 阶段 | Epic | 内容 | 工时 |
|------|------|------|------|
| Phase 1 | Epic 1 | 主题状态管理（Context + toggle） | 2h |
| Phase 2 | Epic 2 | 持久化 + 组件同步 | 3h |
| Phase 3 | Epic 3 | API 绑定 + 数据合并 | 2h |
| Phase 4 | 测试 | 验收测试 + 回归测试 | 1h |

**总计**: 8h

---

*PRD 完成，等待 Dev 领取实现任务*
