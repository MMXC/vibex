# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Epic 1: 路由重定向架构 (2026-03-21)

#### Added
- **middleware.ts**: 新建路由重定向中间件，配置 `/confirm/*` 和 `/requirements/*` → `/` 的 301 重定向
  - 支持 `/confirm` 下所有子路由重定向
  - 保留 `/requirements/new` 路由不被重定向
- **@deprecated 注释**: 在以下废弃页面添加了弃用标记
  - `/confirm/page.tsx`
  - `/confirm/context/page.tsx`
  - `/confirm/flow/page.tsx`
  - `/confirm/model/page.tsx`
  - `/confirm/success/page.tsx`
  - `/requirements/page.tsx`
  - `/requirements/page.test.tsx`

#### Changed
- **Navbar.tsx**: 移除导航栏中的「设计」(/confirm) 链接

#### Migration Guide
所有原来通过 `/confirm/*` 和 `/requirements` 访问的功能已迁移到首页步骤流程 (`/`)。用户现在可以在首页完成：
1. 需求输入 → 2. 限界上下文 → 3. 领域模型 → 4. 业务流程

#### Next Steps
- **Epic 2**: Homepage 覆盖确认 - 确保所有步骤组件完整覆盖
- **Epic 3**: Design 步骤合并
- **Epic 4**: 废弃代码清理

---

## [v1.0.58] - 2026-03-18

### Added
- ESLint 性能优化 (添加 --cache，忽略 tests/**)
- Step 2 组件与 DesignStepLayout 集成

### Fixed
- 修复 PreviewArea 订阅 confirmationStore.flowMermaidCode 问题
- 修复 Step 1 按钮调用 generateContexts 问题
- 修复 secure-storage 空 catch 块错误日志

### Security
- 添加安全存储增强

---

For older entries, see the commit history.
