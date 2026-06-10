# PRD — VibeX Sprint81

**Project**: vibex-proposals-sprint81
**Date**: 2026-06-09
**Status**: Draft

---

## 执行摘要

Sprint81 在 S79/S80 基础上推进三个方向：(1) 画布导入能力补全，(2) 设置系统持久化，(3) 协作体验增强。聚焦 P001/P002/P005 三个 P1 功能，预计 3 个 Epic。

---

## Epic-Story 映射

### E1: 画布导入格式支持

**Epic**: 画布导入格式支持扩展
**DoD**:
1. `CanvasImporter` 类支持 `.flow.json` 和 `.flow.zip` 格式解析 (E1.1)
2. `ImportMenu.tsx` 组件：文件选择 + URL 输入 + 拖拽区 (E1.2)
3. 冲突处理 Dialog（同画布名：覆盖/重命名/取消）(E1.3)
4. `DDSToolbar` 集成导入按钮 (E1.4)
5. `CanvasImporter.test.ts` 覆盖所有解析场景 (E1.5)

**验收测试**:
```typescript
expect(parseFlowJson(validJson)).toEqual(expectedCanvas);
expect(parseFlowZip(buffer)).toMatchObject({ nodes: expect.any(Array) });
expect(handleConflict('Cover')).toHaveBeenCalledWith(canvasId);
```

---

### E2: 设置导入导出

**Epic**: 设置数据导入导出
**DoD**:
1. `settingsStore.exportSettings()` → 返回 JSON string (E2.1)
2. `settingsStore.importSettings(json)` → 校验后写入 IndexedDB (E2.2)
3. `SettingsModal` 新增「数据管理」Tab，包含导入/导出按钮 (E2.3)
4. `settingsStore.settings-export.test.ts` 覆盖导入导出 (E2.4)

**验收测试**:
```typescript
const exported = settingsStore.getState().exportSettings();
expect(typeof exported).toBe('string');
const parsed = JSON.parse(exported);
expect(parsed).toHaveProperty('notificationPreferences');
```

---

### E3: 画布性能监控面板

**Epic**: 画布性能监控面板
**DoD**:
1. `usePerformanceMonitor` hook: `getFPS()` / `getNodeCount()` / `getEdgeCount()` (E3.1)
2. `PerformanceMonitor.tsx` 组件: 实时 FPS 指示器 + 统计数字 (E3.2)
3. 嵌入 `DDSCanvasPage` 侧边栏或右下角悬浮 (E3.3)
4. `PerformanceMonitor.test.tsx` 覆盖 FPS 计算逻辑 (E3.4)

**验收测试**:
```typescript
expect(FPS).toBeGreaterThan(0);
expect(FPS).toBeLessThanOrEqual(60);
expect(nodeCount).toBeGreaterThanOrEqual(0);
```

---

## Cross-Epic 集成点

| 集成点 | 涉及 Epic | 说明 |
|--------|-----------|------|
| DDSToolbar | E1, E2 | E1 添加导入按钮，E2 设置 Tab |
| settingsStore | E2 | export/import 方法 |
| NotificationPanel | E2 | 偏好设置导入后立即生效 |

---

## 技术约束

- 所有新组件使用 TypeScript，遵循现有代码风格
- vitest 覆盖率: 每个 Epic ≥ 1 个测试文件，核心逻辑 ≥ 5 个用例
- IndexedDB 版本升至 v12（新增 `settings_export` objectStore）
- 不修改 S80 已完成的 SettingsModal 4-tab 结构，E2 新增 Tab 追加到末尾

---

## 质量标准

- vitest: 每个 Epic 至少 1 个测试文件，核心逻辑 5+ 测试用例
- ESLint: 0 errors
- 功能: 所有 DoD 条目 `expect()` 可验证
- 页面集成: DDSToolbar / SettingsModal 明确标注

---

## 非目标 (Out of Scope)

- 不实现 AI 模板推荐（P004 延后）
- 不实现协作热力图统计（P003 延后）
- 不实现跨租户画布迁移
