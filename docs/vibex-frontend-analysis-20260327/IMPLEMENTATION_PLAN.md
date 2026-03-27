# Implementation Plan: vibex-frontend-analysis-20260327

**Project**: VibeX 画布到创建项目流程修复
**Architect**: Architect Agent | **Date**: 2026-03-27
**Dev**: ~8h | **Test**: ~3h | **Total**: ~11h

> ⚠️ 与 `vibex-canvas-analysis` 重叠，建议 Dev 阶段合并处理。

---

## Epic 1: 示例数据导入流程修复 (P0)

### 任务清单
- [ ] 创建 `public/data/sample-canvas.json`（F1.1）
- [ ] 扩展 `canvasStore.ts` — `loadSampleData()` action（F1.2）
- [ ] 修改 `CanvasPage.tsx` — ImportButton onClick 绑定（F1.2）
- [ ] `ProjectBar.tsx` — allConfirmed 联动 + disabled title（F1.3）

### 验收
```typescript
expect(fireEvent.click(getByText(/导入示例/))).toChangeTreeState();
expect(createProjectBtn).toBeEnabled(); // 示例加载后
```

**工时**: 5h

---

## Epic 2: 登录引导与 Onboarding 优化 (P1)

### 任务清单
- [ ] `src/pages/IndexPage.tsx` — 登录检查 + toast（F2.1）
- [ ] `OnboardingProgressBar.tsx` — pointer-events 修复（F2.2）

### 验收
```typescript
expect(unauthenticatedClick('开始使用')).toShowDialog(/请先登录/);
expect(skipIntro()).toEnableClick('开始使用');
```

**工时**: 3h

---

## Epic 3: 步骤进度条引导增强 (P2)

### 任务清单
- [ ] 禁用步骤添加 title tooltip（F3.1）
- [ ] 创建 `TreeStatus.tsx` 显示确认进度（F3.2）
- [ ] ProjectBar disabled 时 title（F3.3）

### 验收
```typescript
expect(disabledStep).toHaveAttribute('title', /.+/);
expect(treeStatus).toHaveTextContent(/上下文 \d+/);
```

**工时**: 3h

---

## 文件变更清单

```
public/data/sample-canvas.json      [新增] F1.1
src/lib/canvas/canvasStore.ts     [修改] F1.2
src/pages/CanvasPage.tsx           [修改] F1.2
src/components/ProjectBar.tsx      [修改] F1.3, F3.3
src/pages/IndexPage.tsx            [修改] F2.1
src/components/OnboardingProgressBar.tsx [修改] F2.2
src/components/canvas/TreeStatus.tsx [新增] F3.2
e2e/frontend-analysis.spec.ts     [新增]
```
