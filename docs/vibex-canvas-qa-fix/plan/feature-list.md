# Feature List — VibeX Canvas QA 修复

**项目**: vibex-canvas-qa-fix
**基于**: Analyst 报告 (analysis.md)
**日期**: 2026-04-13
**Plan 类型**: bugfix
**推荐方案**: 全部选方案 A（推荐方案）

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F0.1 | API 404 真实性验证 | 通过 gstack qa 调用实际 API，确认 /v1/canvas/snapshots 返回码 | R2, AC-3 | 0.5h |
| F1.1 | contextStore skipHydration | contextStore persist 配置添加 `skipHydration: true` | JTBD-1, AC-1, AC-2 | 0.5h |
| F1.2 | flowStore skipHydration | flowStore persist 配置添加 `skipHydration: true` | JTBD-1, AC-1, AC-2 | 0.5h |
| F1.3 | componentStore skipHydration | componentStore persist 配置添加 `skipHydration: true` | JTBD-1, AC-1, AC-2 | 0.5h |
| F1.4 | uiStore skipHydration | uiStore persist 配置添加 `skipHydration: true` | JTBD-1, AC-1, AC-2 | 0.5h |
| F1.5 | sessionStore skipHydration | sessionStore persist 配置添加 `skipHydration: true` | JTBD-1, AC-1, AC-2 | 0.5h |
| F1.6 | CanvasPage 手动 rehydrate | CanvasPage.tsx 添加 `useEffect` 触发各 store rehydrate | JTBD-1, AC-1 | 0.5h |
| F2.1 | API 路径 /v1/ 前缀统一 | api-config.ts 中 snapshots 端点改为 `/v1/canvas/snapshots` | JTBD-2, AC-3, AC-4 | 0.25h |
| F2.2 | snapshot/restoreSnapshot 路径确认 | 确认 snapshot(id)/restoreSnapshot(id) 路径一致性 | JTBD-2, AC-4 | 0.25h |
| F3.1 | 默认 phase 初始化 | sessionStore/contextStore 中 phase === undefined 时默认设为 'context' | JTBD-3, AC-5 | 0.5h |
| F3.2 | Tab phase 守卫保留 | 保留 TabBar.tsx 的 phase 守卫逻辑，只修 phase 初始化 | JTBD-3, AC-6 | 0.25h |

**总工时**: ~5.5h

---

## Epic 划分

| Epic | 主题 | 包含功能 | 工时 |
|------|------|---------|------|
| E0 | 前置验证 | F0.1 | 0.5h |
| E1 | Hydration mismatch 修复 | F1.1-F1.6 | 3h |
| E2 | API 路径统一 | F2.1-F2.2 | 0.5h |
| E3 | Tab 默认 phase | F3.1-F3.2 | 0.75h |

---

## 依赖关系

```
E0（前置）→ 先执行
E1（Hydration）→ 可独立，与 E0 并行
E2（API 路径）→ 依赖 E0 API 验证结果
E3（Tab phase）→ 可独立
```

---

## 验收条件

- [ ] /canvas 页面直接访问不触发 Error #300
- [ ] 5 个 Canvas stores 全部有 skipHydration: true
- [ ] API snapshots 列表返回 200
- [ ] 新用户访问 /canvas，context Tab 默认可用
