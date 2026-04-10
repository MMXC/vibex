# Feature List — VibeX 技术债清理

**项目**: vibex-dev-proposals-task
**基于**: Analyst 报告 (analysis.md)
**日期**: 2026-04-11
**Plan 类型**: refactor
**Plan 深度**: Standard

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | Auth 页面内联样式迁移 | 将 ~15 个 inline style 对象迁移到 auth.module.css | 问题1 | 3-5 天 |
| F1.2 | Auth hover 修复 | 修复 CSS 变量 fallback，添加 --color-primary-hover | 问题7 | 1h |
| F2.1 | Preview 页面内联样式迁移 | 将 ~362 处内联样式迁移到 preview.module.css | 问题2 | 2-3 天 |
| F2.2 | Preview 硬编码颜色清理 | 移除硬编码颜色，使用 CSS 变量 | 问题2 | 1 天 |
| F3.1 | renderer.ts 模块拆分 | 拆分为 types/style-utils/component-renderers/theme-resolver/main | 问题3 | 2 天 |
| F3.2 | renderer 错误 fallback 修复 | 使用 CSS 变量替换硬编码错误颜色 | 问题3 | 1h |
| F3.3 | renderer Vitest 测试 | 每个子模块编写单元测试 | 问题3 | 1 天 |
| F4.1 | CanvasPage 职责拆分 | 提取 Layout/Header/Panels 子组件 | 问题4 | 1-2 天 |
| F5.1 | Store 分层文档 | 建立 docs/architecture/store-architecture.md | 问题5 | 0.5 天 |
| F5.2 | 重复 Store 合并 | 清理 simplifiedFlowStore vs flowStore 重复 | 问题5 | 1 天 |
| F5.3 | crossStoreSync 测试 | 为跨 store 同步逻辑补充 Vitest | 问题5 | 0.5 天 |
| F6.1 | Firebase 协作状态标注 | README.md 更新"多人协作"为"规划中" | 问题6 | 1h |
| F7.1 | ESLint 豁免清理 | 建立 quarterly review 机制 | 问题8 | 0.5 天 |

**总工时**: ~12-18 天

---

## Epic 划分

| Epic | 主题 | 包含 Story | 工时 |
|------|------|-----------|------|
| Epic 1 | 设计系统统一（Auth） | F1.1, F1.2 | 3-5 天 |
| Epic 2 | 设计系统统一（Preview） | F2.1, F2.2 | 3-4 天 |
| Epic 3 | 渲染引擎重构 | F3.1, F3.2, F3.3 | 3 天 |
| Epic 4 | Canvas 组件拆分 | F4.1 | 1-2 天 |
| Epic 5 | Store 体系规范化 | F5.1, F5.2, F5.3 | 2 天 |
| Epic 6 | 文档与豁免治理 | F6.1, F7.1 | 1h |

---

## 依赖关系

```
Epic 1（Auth）→ 无依赖，独立执行
Epic 2（Preview）→ 无依赖，独立执行
Epic 3（renderer）→ 无依赖，独立执行
Epic 4（Canvas）→ Epic 3 可并行
Epic 5（Store）→ 无依赖，独立执行
Epic 6（文档）→ 无依赖，随时可执行
```
