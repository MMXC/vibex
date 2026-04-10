# Feature List — VibeX 产品体验优化

**项目**: vibex-pm-proposals-vibex-build-fixes-20260411
**基于**: PM 提案报告 (pm-proposals.md)
**日期**: 2026-04-11
**Plan 类型**: refactor + feat
**Plan 深度**: Standard

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 权限后移 | 所有 RBAC 检查移至后端 API，前端移除 JWT 解码和权限逻辑 | P1.1 | 4h |
| F1.2 | AI加载状态 | 设计页面/Chat 页面统一加载状态组件，提供取消按钮 | P1.2 | 2h |
| F1.3 | AI错误信息 | 后端错误码→中文友好提示映射，覆盖常见失败场景 | P1.3 | 1h |
| F1.4 | 删除确认 | Dashboard 项目删除添加二次确认 Dialog | P1.4 | 1h |
| F1.5 | Confirm页面标注 | /confirm 页面添加说明 banner 或功能状态标签 | P1.5 | 30min |
| F2.1 | Canvas引导 | 三树联动引导 Overlay + 快捷键帮助 | P2.1 | 3h |
| F2.2 | AI输入debounce | 设计/Chat 页面输入框添加 300ms debounce | P2.2 | 1h |
| F2.3 | 版本历史透明化 | VersionHistoryPanel + SaveIndicator 展示保存时间 | P2.3 | 2h |
| F2.4 | Settings mock标注 | Project Settings TODO 项标注「即将上线」 | P2.4 | 30min |
| F2.5 | 路由统一 | 清理 / 重定向，消除双重入口 | P2.5 | 1h |
| F2.6 | Export功能标注 | Export 页面不可用项标注「即将推出」 | P2.6 | 30min |
| F2.7 | 注册入口优化 | Auth 页面添加「立即注册」切换链接 | P2.7 | 1h |
| F2.8 | 样式统一 | Auth 页面内联样式迁移至 CSS Module | P2.8 | 2h |
| F3.1 | 表单校验 | 邮箱实时格式 + 密码强度指示条 | P3.1 | 2h |
| F3.2 | 批量操作 | Dashboard 批量选择/移动/删除 | P3.2 | 4h |
| F3.3 | 移动端手势 | Canvas 画布添加捏合缩放等手势 | P3.3 | 4h |
| F3.4 | Onboarding完善 | 实现新用户引导流程 | P3.4 | 6h |
| F3.5 | 登录中间件 | Next.js Middleware 统一认证拦截 | P3.5 | 2h |
| F3.6 | 人工延迟移除 | 删除 ProjectCreation/BusinessFlow 中的硬编码 setTimeout | P3.6 | 30min |
| F3.7 | Trash体验优化 | 删除 Toast 提示 + 恢复目标选择 | P3.7 | 2h |

**总工时**: ~43h（建议分 2-3 个 Sprint）

---

## Epic 划分

| Epic | 主题 | 包含 Story | 工时 |
|------|------|-----------|------|
| Epic 1 | 安全与可靠性 | F1.1, F1.2, F1.3, F1.4, F3.5 | ~11h |
| Epic 2 | 导航与信息架构 | F1.5, F2.4, F2.5, F2.6, F2.7 | ~4h |
| Epic 3 | Canvas 体验增强 | F2.1, F2.2, F2.3, F3.3 | ~10h |
| Epic 4 | 表单与交互优化 | F1.2(含), F2.8, F3.1, F3.2, F3.7 | ~11h |
| Epic 5 | 新用户引导 | F3.4 | ~6h |
| Epic 6 | 体验清理 | F3.6 | ~0.5h |

---

## 依赖关系

```
Epic 1（安全）→ 无外部依赖
Epic 2（导航）→ 无外部依赖
Epic 3（Canvas）→ Epic 1（安全基础）可并行
Epic 4（表单）→ Epic 1 部分完成即可
Epic 5（引导）→ Epic 2 完成
Epic 6（清理）→ 可随时执行
```
