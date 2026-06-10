# Architecture — VibeX Sprint81

**Project**: vibex-proposals-sprint81
**Date**: 2026-06-09
**Architect**: coord (self-impl)

---

## 1. E1: 画布导入格式支持

### 架构决策

**问题**: 现有 `ZipExporter` 支持导出但无导入能力，用户无法从文件/URL 导入画布。

**方案**: 新增 `CanvasImporter` 类，复用 `ZipExporter` 的解析逻辑镜像实现导入。

### 文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/lib/canvas/CanvasImporter.ts` | **新增** | 核心导入器：parseFlowJson + parseFlowZip + handleConflict |
| `src/components/dds/canvas/ImportMenu.tsx` | **新增** | 导入菜单：文件选择 + URL 输入 + 拖拽区 |
| `src/components/dds/canvas/ImportConflictDialog.tsx` | **新增** | 冲突处理 Dialog |
| `src/components/dds/toolbar/DDSToolbar.tsx` | **扩展** | 添加导入按钮 |
| `src/lib/canvas/CanvasImporter.test.ts` | **新增** | 测试文件 |

### 关键接口

```typescript
// CanvasImporter.ts
export function parseFlowJson(json: string): CanvasData
export async function parseFlowZip(buffer: ArrayBuffer): Promise<CanvasData>
export type ConflictResolution = 'overwrite' | 'rename' | 'cancel'
export async function importCanvas(data: CanvasData, conflict: ConflictResolution): Promise<void>
```

### 技术约束

- `parseFlowZip` 复用 `JSZip`（`ZipExporter` 已引入）
- `CanvasData` 类型复用来 `ZipExporter.export()` 的返回值类型
- 不修改 `ZipExporter` 现有导出逻辑

---

## 2. E2: 设置导入导出

### 架构决策

**问题**: `notificationStore` 偏好存 IndexedDB 但无导出接口，用户换设备后设置丢失。

**方案**: `settingsStore` 新增 `exportSettings()` / `importSettings(json)`，新增 IndexedDB `settings_export` objectStore。

### 文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/stores/dds/settingsStore.ts` | **扩展** | exportSettings + importSettings 方法 |
| `src/lib/canvas/historyDB.ts` | **扩展** | DB_VERSION 11→12，新增 settings_export objectStore |
| `src/components/dds/settings/SettingsDataPanel.tsx` | **新增** | 数据管理 Tab 组件（导入/导出按钮） |
| `src/components/dds/settings/SettingsModal.tsx` | **扩展** | 新增「数据管理」Tab |
| `src/stores/dds/settingsStore.test.ts` | **新增** | 测试文件 |

### 关键接口

```typescript
// settingsStore.ts
interface SettingsExport {
  version: 1;
  exportedAt: number;
  notificationPreferences: NotificationPreferences;
  dprMode: 'auto' | '1x' | '2x';
  shortcutSettings: ShortcutSettings;
  canvasSettings: CanvasSettings;
}

// settingsStore actions
exportSettings(): string  // → JSON string
importSettings(json: string): boolean  // returns false if invalid
```

### IndexedDB 变更

```
DB_VERSION: 11 → 12
新增: settings_export objectStore { keyPath: 'id' }
  { id: 'user_settings', version: 1, exportedAt: timestamp, data: SettingsExport }
```

### 技术约束

- 导出文件格式: `vibex-settings-{date}.json`
- 导入前校验 version 字段和必需字段
- `SettingsDataPanel` 放在 SettingsModal 的第 5 个 Tab（末尾追加）

---

## 3. E3: 画布性能监控面板

### 架构决策

**问题**: DPR 缩放优化完成但用户无法量化性能收益。

**方案**: `usePerformanceMonitor` hook 采集 FPS + 节点统计，`PerformanceMonitor` 悬浮组件展示。

### 文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/hooks/canvas/usePerformanceMonitor.ts` | **新增** | FPS 采样 + 节点统计 hook |
| `src/components/dds/canvas/PerformanceMonitor.tsx` | **新增** | 悬浮监控面板组件 |
| `src/components/dds/canvas/PerformanceMonitor.module.css` | **新增** | 样式 |
| `src/pages/dds/DDSCanvasPage.tsx` | **扩展** | 集成 PerformanceMonitor |
| `src/components/dds/canvas/PerformanceMonitor.test.tsx` | **新增** | 测试文件 |

### 关键接口

```typescript
// usePerformanceMonitor.ts
export function usePerformanceMonitor(): {
  fps: number;
  nodeCount: number;
  edgeCount: number;
  isVisible: boolean;
  toggleVisibility: () => void;
}

// FPS 算法: requestAnimationFrame 循环采样，1s 窗口计算帧率
// 节点统计: 读取 ReactFlow 的 getNodes() / getEdges()
```

### 技术约束

- FPS 采样: `requestAnimationFrame` 循环，1 秒窗口滚动平均
- 组件定位: 绝对定位右下角 `bottom: 16px; right: 16px`
- 默认隐藏，用户可通过工具栏按钮切换
- 不影响 DPR 决策（S80-E4 保持独立）

---

## Cross-Epic 集成点

| 集成点 | E1 ↔ E2 | E1 ↔ E3 | E2 ↔ E3 |
|--------|---------|---------|---------|
| DDSToolbar | ✅ 导入按钮 | — | — |
| SettingsModal | — | — | ✅ 数据管理 Tab |
| DDSCanvasPage | — | ✅ PerformanceMonitor | — |

---

## 技术债务处理

1. **IndexedDB DB_VERSION**: `historyDB.ts` 从 11 升至 12，onversionchange 处理 v11→v12 迁移
2. **notificationStore + settingsStore 分离**: S80-E1 偏好存在 notificationStore，S81 E2 导出从 settingsStore 统一导出，两者独立读取
