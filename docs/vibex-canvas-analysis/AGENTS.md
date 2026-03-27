# AGENTS.md: vibex-canvas-analysis

**Project**: VibeX 新画布到创建项目流程优化
**Architect**: Architect Agent
**Date**: 2026-03-27

---

## Dev 约束

### 强制规范

1. **不改 AI 生成逻辑**: 任何修改都不能触及 AI 生成相关代码
2. **不改 DDD 数据模型**: 只改 UI 行为，不动 domain types
3. **不改游客模式**: 本次范围明确不含游客模式
4. **data-testid 规范**: 所有新增交互元素必须添加 `data-testid`
5. **不引入新依赖**: 仅使用现有 Zustand + React + Playwright

### 禁止事项

- ❌ 不要修改 `src/lib/ai/` 目录下的任何文件
- ❌ 不要修改 `src/types/` 下的 domain types（只读）
- ❌ 不要在 store 中引入异步 loading 状态（本次范围简单，同步即可）
- ❌ 不要修改 `src/components/canvas/nodes/` 下的节点渲染组件

### 提交规范

```
fix(canvas): 导入示例流程阻断（F-1.1~F-1.3）
fix(homepage): 未登录引导优化（F-2.1~F-2.2）
feat(canvas): 三树状态进度显示（F-3.2）
test(e2e): 画布分析流程集成测试
```

---

## Tester 约束

### E2E 测试规范

1. **使用 gstack browse**：`page.goto(...)` → `await browse('goto', url)`
2. **等待数据加载**: `await page.waitForTimeout(500)` 确保 store 更新
3. **data-testid 选择器**: 优先用 `data-testid` 而非 CSS 选择器
4. **登录状态控制**: 使用 `authStore.setMockAuthenticated(true/false)` 控制

### 测试路径

```
e2e/canvas-analysis.spec.ts
```

---

## 关键文件路径

| 文件 | 作用 | Epic |
|------|------|------|
| `src/data/example-canvas.json` | 示例数据 | E1 |
| `src/lib/canvas/canvasStore.ts` | 状态管理（核心改动） | E1 |
| `src/components/canvas/CanvasPage.tsx` | 页面入口 | E1/E3 |
| `src/components/project/ProjectBar.tsx` | 按钮状态 | E1/E3 |
| `src/components/auth/AuthToast.tsx` | Toast 提示 | E2 |
| `src/components/home/HomePage.tsx` | 首页入口 | E2 |
| `src/components/canvas/TreeStatus.tsx` | 进度显示（新增） | E3 |
