# IMPLEMENTATION_PARTITION — VibeX Sprint81

**Project**: vibex-proposals-sprint81
**Date**: 2026-06-09
**Status**: Ready for Phase2

---

## E1: 画布导入格式支持

### DoD Checklist

- [ ] **E1.1**: `CanvasImporter.parseFlowJson(json: string): CanvasData` — 解析 .flow.json 格式，复用 ZipExporter 类型
- [ ] **E1.2**: `CanvasImporter.parseFlowZip(buffer: ArrayBuffer): Promise<CanvasData>` — 解压 ZIP，内含 .flow.json
- [ ] **E1.3**: `ImportMenu.tsx` — 文件选择 `<input type="file">` + URL 输入框 + 拖拽区 `onDrop`
- [ ] **E1.4**: `ImportConflictDialog.tsx` — 同名画布冲突处理：覆盖/重命名/取消 三个按钮
- [ ] **E1.5**: `DDSToolbar.tsx` — 在现有工具栏按钮行末尾添加「导入」按钮
- [ ] **E1.6**: `CanvasImporter.test.ts` — 覆盖正常解析、ZIP 解压、冲突处理分支

### 新增文件

- `src/lib/canvas/CanvasImporter.ts` (新)
- `src/components/dds/canvas/ImportMenu.tsx` (新)
- `src/components/dds/canvas/ImportConflictDialog.tsx` (新)
- `src/lib/canvas/CanvasImporter.test.ts` (新)

### 扩展文件

- `src/components/dds/toolbar/DDSToolbar.tsx` — 导入按钮

### 关键路径

- `ZipExporter.ts` (已有): `src/services/export/ZipExporter.ts`
- `DDSToolbar.tsx` (已有): `src/components/dds/toolbar/DDSToolbar.tsx`

### expect() 断言示例

```typescript
import { parseFlowJson, parseFlowZip, importCanvas } from '@/lib/canvas/CanvasImporter';

describe('CanvasImporter', () => {
  it('parses valid .flow.json', () => {
    const result = parseFlowJson(JSON.stringify({ nodes: [], edges: [] }));
    expect(result).toHaveProperty('nodes');
    expect(result).toHaveProperty('edges');
  });

  it('rejects invalid JSON', () => {
    expect(() => parseFlowJson('not-json')).toThrow('Invalid JSON');
  });

  it('imports without conflict when no duplicate', async () => {
    const canvasData = { nodes: [], edges: [] };
    await expect(importCanvas(canvasData, 'overwrite')).resolves.toBeUndefined();
  });
});
```

---

## E2: 设置导入导出

### DoD Checklist

- [ ] **E2.1**: `settingsStore.exportSettings(): string` — 序列化当前所有设置为 JSON，包含版本号
- [ ] **E2.2**: `settingsStore.importSettings(json: string): boolean` — 校验版本号和字段，失败返回 false
- [ ] **E2.3**: `historyDB.ts` DB_VERSION 11→12，onversionchange 处理迁移，新增 `settings_export` objectStore
- [ ] **E2.4**: `SettingsDataPanel.tsx` — 导入/导出按钮，导出触发文件下载，导入触发 `<input type="file">`
- [ ] **E2.5**: `SettingsModal.tsx` — 新增「数据管理」Tab（TabBar 末尾追加）
- [ ] **E2.6**: `settingsStore.settings-export.test.ts` — 覆盖 export/import 正常路径 + 无效 JSON + 版本不匹配

### 新增文件

- `src/components/dds/settings/SettingsDataPanel.tsx` (新)
- `src/stores/dds/settingsStore.test.ts` (新)

### 扩展文件

- `src/stores/dds/settingsStore.ts` — exportSettings + importSettings
- `src/lib/canvas/historyDB.ts` — DB_VERSION 11→12
- `src/components/dds/settings/SettingsModal.tsx` — TabBar 添加「数据管理」

### 关键路径

- `historyDB.ts` (已有): `src/lib/canvas/historyDB.ts` — `DB_VERSION = 11`
- `settingsStore.ts` (已有): `src/stores/dds/settingsStore.ts`
- `SettingsModal.tsx` (已有): `src/components/dds/settings/SettingsModal.tsx`

### expect() 断言示例

```typescript
import { settingsStore } from '@/stores/dds/settingsStore';

describe('settingsStore export/import', () => {
  it('exports valid JSON', () => {
    const exported = settingsStore.getState().exportSettings();
    const parsed = JSON.parse(exported);
    expect(parsed.version).toBe(1);
    expect(parsed).toHaveProperty('notificationPreferences');
  });

  it('imports valid settings and returns true', () => {
    const data = JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      notificationPreferences: { channels: { inApp: true, browser: false }, types: {} },
      dprMode: 'auto',
      shortcutSettings: {},
      canvasSettings: {},
    });
    const result = settingsStore.getState().importSettings(data);
    expect(result).toBe(true);
  });

  it('rejects invalid JSON and returns false', () => {
    const result = settingsStore.getState().importSettings('not-json');
    expect(result).toBe(false);
  });

  it('rejects wrong version and returns false', () => {
    const data = JSON.stringify({ version: 99, exportedAt: Date.now(), data: {} });
    const result = settingsStore.getState().importSettings(data);
    expect(result).toBe(false);
  });
});
```

---

## E3: 画布性能监控面板

### DoD Checklist

- [ ] **E3.1**: `usePerformanceMonitor` hook — `getFPS()` requestAnimationFrame 循环，`getNodeCount()` / `getEdgeCount()` 从 ReactFlow 获取
- [ ] **E3.2**: `PerformanceMonitor.tsx` — 实时 FPS 数字 + 节点/边计数，悬浮右下角，折叠/展开
- [ ] **E3.3**: `DDSCanvasPage.tsx` — 集成 `<PerformanceMonitor>` 组件，`bottom: 16px; right: 16px` 定位
- [ ] **E3.4**: `PerformanceMonitor.test.tsx` — 覆盖 FPS 边界值、折叠状态、节点计数

### 新增文件

- `src/hooks/canvas/usePerformanceMonitor.ts` (新)
- `src/components/dds/canvas/PerformanceMonitor.tsx` (新)
- `src/components/dds/canvas/PerformanceMonitor.module.css` (新)
- `src/components/dds/canvas/PerformanceMonitor.test.tsx` (新)

### 扩展文件

- `src/pages/dds/DDSCanvasPage.tsx` — 集成 PerformanceMonitor

### 关键路径

- `DDSCanvasPage.tsx` (已有): `src/pages/dds/DDSCanvasPage.tsx` — 从 `@/pages/dds/DDSCanvasPage.tsx` 导入
- `ReactFlow hooks`: `useReactFlow` from `reactflow`

### expect() 断言示例

```typescript
import { render, screen } from '@testing-library/react';
import { PerformanceMonitor } from './PerformanceMonitor';

describe('PerformanceMonitor', () => {
  it('displays FPS value', () => {
    render(<PerformanceMonitor fps={60} nodeCount={10} edgeCount={5} />);
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('displays node and edge counts', () => {
    render(<PerformanceMonitor fps={60} nodeCount={10} edgeCount={5} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows warning style when FPS < 30', () => {
    render(<PerformanceMonitor fps={20} nodeCount={0} edgeCount={0} />);
    expect(screen.getByText('20')).toHaveClass(/warning/);
  });
});
```

---

## Vitest 测试命令

```bash
cd vibex-fronted
npx vitest run CanvasImporter.test.ts --reporter=verbose
npx vitest run settingsStore --reporter=verbose
npx vitest run PerformanceMonitor.test.tsx --reporter=verbose
```
