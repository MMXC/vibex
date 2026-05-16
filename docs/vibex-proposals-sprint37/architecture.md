# VibeX Sprint 37 — 架构设计文档

**Agent**: architect
**日期**: 2026-05-17
**项目**: vibex-proposals-sprint37
**仓库**: /root/.openclaw/vibex

---

## 1. 技术选型

### 1.1 现有架构约束

| 层级 | 技术 | 决策 |
|------|------|------|
| 前端框架 | Next.js 15 (App Router) | 沿用，新增 error.tsx / Settings page |
| 状态管理 | Zustand + localStorage | 沿用，新增 `userPreferencesStore` |
| 数据获取 | TanStack Query | 沿用 |
| 样式 | CSS Modules + CSS Variables | 沿用，扩展 `design-tokens.css` |
| 后端 | Cloudflare Workers | 沿用，新增 PDF 端点 |
| 数据库 | Cloudflare D1 | 暂不新增 schema，轻量数据走 localStorage |
| 部署 | Cloudflare Pages | 沿用 |

### 1.2 新增依赖

| 功能 | 库 | 用途 | SSR 安全 |
|------|-----|------|---------|
| F002 PNG导出 | `html2canvas` | Canvas DOM → PNG Blob | ❌ Client-only，dynamic import |
| F002 PDF生成 | `@react-pdf/renderer` | PDF模板渲染 | ⚠️ 改用 Cloudflare Workers 端点（见§2.3） |
| F001 Help Overlay | — | 原生 React + CSS Modules | ✅ |

> **架构决策**：PDF 生成不引入 `@react-pdf/renderer`（客户端包体积 ~2MB + SSR 兼容问题）。改由 Cloudflare Worker 生成，减少前端包体积。

### 1.3 技术决策记录 (ADR)

```
ADR-001: PDF 生成移至 Cloudflare Workers
  原因: html2canvas SSR 问题 + @react-pdf 包体积
  决策: 前端只负责 PNG/SVG 客户端导出；PDF 通过 /api/export/pdf POST 请求生成
  影响: 新增 backend/src/app/api/export/pdf/route.ts

ADR-002: Preferences 使用 localStorage 而非 D1
  原因: 用户偏好是个人设备级数据，localStorage 已足够；D1 适合跨设备同步（Future）
  决策: Zustand persist middleware → localStorage
  影响: 无服务端改动；向后兼容

ADR-003: ThemeProvider 嵌套在 App Router layout 中
  原因: Next.js 15 RSC 要求 Providers 客户端边界清晰
  决策: ThemeProvider 封装为 Client Component，SSR 时降级到 default theme
```

---

## 2. 接口设计

### 2.1 Frontend: Hooks & Stores

#### F001: `useKeyboardShortcuts`

```typescript
// File: vibex-fronted/src/hooks/useKeyboardShortcuts.ts

interface ShortcutConfig {
  key: string;           // e.g. 'z', 'Tab', 'Escape'
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;   // for help overlay
  scope?: 'canvas' | 'global';
}

interface UseKeyboardShortcutsOptions {
  /** Skip registration when these elements are focused */
  ignoreWhen?: (event: KeyboardEvent) => boolean;
  /** Enable/disable all shortcuts */
  enabled?: boolean;
}

interface UseKeyboardShortcutsReturn {
  shortcuts: ShortcutConfig[];
  registerShortcut: (config: ShortcutConfig) => () => void; // returns unregister
  showHelp: boolean;
  toggleHelp: () => void;
  hideHelp: () => void;
}

// Keybindings:
// Ctrl+Z         → undo
// Ctrl+Shift+Z / Ctrl+Y → redo
// Ctrl+N         → createNewNode()
// Ctrl+G         → triggerGenerate()
// Tab / Shift+Tab → next/prev Tab
// Escape         → cancelSelection()
// ?              → toggleHelp() (global, no Ctrl)
```

#### F002: `useCanvasExport`

```typescript
// File: vibex-fronted/src/hooks/useCanvasExport.ts (existing, extend)

interface ExportOptions {
  format: 'json' | 'vibex' | 'pdf' | 'png' | 'svg';
  projectId: string;
  filename?: string;
  quality?: number; // PNG quality 0-1
}

interface ExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;         // object URL for preview
  error?: string;
}

interface UseCanvasExportReturn {
  exportCanvas: (options: ExportOptions) => Promise<ExportResult>;
  isExporting: boolean;
  exportProgress: number; // 0-1
  error: string | null;
}

// New exports:
// - PNG: html2canvas(canvasEl) → canvas.toBlob() → download
// - SVG: serializeCanvasToSVG() → Blob → download
// - PDF: POST /api/export/pdf → receive PDF blob → download
```

#### F004: `userPreferencesStore`

```typescript
// File: vibex-fronted/src/stores/userPreferencesStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ShortcutCustomization {
  [shortcutId: string]: string; // shortcutId → key binding
}

interface UserPreferences {
  theme: Theme;
  defaultTemplate: string | null;
  shortcutCustomization: ShortcutCustomization;
  version: number; // for migration
}

interface UserPreferencesStore {
  preferences: UserPreferences;
  setTheme: (theme: Theme) => void;
  setDefaultTemplate: (templateId: string | null) => void;
  setShortcutCustomization: (shortcuts: ShortcutCustomization) => void;
  resetToDefaults: () => void;
}

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set) => ({
      preferences: {
        theme: 'system',
        defaultTemplate: null,
        shortcutCustomization: {},
        version: 1,
      },
      setTheme: (theme) =>
        set((state) => ({
          preferences: { ...state.preferences, theme },
        })),
      setDefaultTemplate: (templateId) =>
        set((state) => ({
          preferences: { ...state.preferences, defaultTemplate: templateId },
        })),
      setShortcutCustomization: (shortcuts) =>
        set((state) => ({
          preferences: { ...state.preferences, shortcutCustomization: shortcuts },
        })),
      resetToDefaults: () =>
        set({
          preferences: {
            theme: 'system',
            defaultTemplate: null,
            shortcutCustomization: {},
            version: 1,
          },
        }),
    }),
    {
      name: 'vibex-user-preferences',
      version: 1,
    }
  )
);
```

### 2.2 Frontend: Components

| 组件 | 文件 | 类型 | 描述 |
|------|------|------|------|
| `KeyboardHelpOverlay` | `src/components/shared/KeyboardHelpOverlay.tsx` | Client | 快捷键帮助浮层 |
| `ErrorBoundary` | `src/components/shared/ErrorBoundary.tsx` | Client | React Error Boundary |
| `ThemeProvider` | `src/components/providers/ThemeProvider.tsx` | Client | 主题上下文 Provider |
| `DDSErrorsFallback` | `src/components/shared/DDSErrorsFallback.tsx` | Client | Canvas 崩溃降级 UI |
| `ExportMenu` | `src/components/dds/toolbar/ExportMenu.tsx` | Client | DDSToolbar 导出下拉菜单 |
| `SettingsPage` | `src/app/settings/page.tsx` | RSC | 设置页面 |
| `DDSErrorPage` | `src/app/dds/[projectId]/error.tsx` | Client | Next.js Error Boundary |

### 2.3 Backend: API Endpoints

#### `POST /api/export/pdf`

```typescript
// File: vibex-backend/src/app/api/export/pdf/route.ts
// Method: POST
// Auth: project owner (projectId in body)

// Request body
interface PdfExportRequest {
  projectId: string;
  canvasData: {
    title: string;
    chapters: Array<{
      id: string;
      title: string;
      content: string;
      type: 'requirement' | 'flow' | 'context';
    }>;
    metadata: {
      createdAt: string;
      updatedAt: string;
      author?: string;
    };
  };
  options?: {
    includeMetadata?: boolean;
    paperSize?: 'A4' | 'Letter';
  };
}

// Response
// Content-Type: application/pdf
// Content-Disposition: attachment; filename="canvas-{projectId}-{timestamp}.pdf"
// Status: 200 | 400 | 401 | 404 | 500

// Error response
// { error: string; code?: string; }
// Codes: MISSING_PROJECT | UNAUTHORIZED | PDF_GENERATION_FAILED
```

**实现方案**：Cloudflare Workers 使用 `@react-pdf/render` 或 HTML-to-PDF 库（如 `puppeteer` 非 CF 兼容，改用 `@react-pdf/renderer` 或模板字符串生成）。

**备选方案（轻量）**：使用 `puppeteer-core` + `@sparticuz/chromium`（Cloudflare Workers 支持的 Chromium）。若部署复杂，fallback 到客户端 PDF 生成（`window.print()` → 浏览器 PDF）。

#### `POST /api/telemetry/errors` (Optional)

```typescript
// File: vibex-backend/src/app/api/telemetry/errors/route.ts
// Method: POST
// Auth: anonymous (no auth required for error telemetry)

interface ErrorTelemetryRequest {
  error: {
    message: string;
    stack?: string;
    componentStack?: string;
  };
  context: {
    url: string;
    userAgent: string;
    projectId?: string;
    timestamp: string;
    theme?: string;
  };
}

// Response: 204 No Content
// Rate limit: 10 req/min per IP (CF WAF rule)
```

> **Note**: This endpoint is optional. Errors are primarily logged via `console.error`. Telemetry can be enabled via a feature flag.

### 2.4 Cloudflare D1 Schema Changes

**无 D1 schema 变更**。所有 Sprint 37 数据使用：
- `localStorage` — user preferences, shortcut customization
- In-memory / KV — error telemetry (optional, rate-limited)

---

## 3. 文件变更总览

```
vibex-fronted/
├── src/
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts       [NEW]
│   │   ├── useKeyboardShortcuts.test.ts  [NEW]
│   │   └── useCanvasExport.ts            [MODIFY — add png/svg/pdf]
│   ├── stores/
│   │   ├── userPreferencesStore.ts       [NEW]
│   │   └── userPreferencesStore.test.ts  [NEW]
│   ├── components/
│   │   ├── shared/
│   │   │   ├── KeyboardHelpOverlay.tsx   [NEW]
│   │   │   ├── KeyboardHelpOverlay.module.css [NEW]
│   │   │   ├── ErrorBoundary.tsx         [NEW]
│   │   │   ├── ErrorBoundary.test.tsx    [NEW]
│   │   │   ├── DDSErrorsFallback.tsx     [NEW]
│   │   │   └── DDSErrorsFallback.module.css [NEW]
│   │   ├── providers/
│   │   │   └── ThemeProvider.tsx          [NEW]
│   │   └── dds/
│   │       └── toolbar/
│   │           └── ExportMenu.tsx        [NEW]
│   ├── app/
│   │   ├── settings/
│   │   │   └── page.tsx                  [NEW]
│   │   ├── dds/[projectId]/
│   │   │   └── error.tsx                 [NEW — Next.js Error Boundary]
│   │   └── error.tsx                    [MODIFY — global fallback]
│   └── styles/
│       ├── design-tokens.css             [MODIFY — add theme vars]
│       └── themes/
│           ├── dark-theme.css            [NEW]
│           ├── enterprise-a-theme.css    [NEW]
│           └── enterprise-b-theme.css    [NEW]
│
vibex-backend/
└── src/
    ├── app/api/export/pdf/
    │   └── route.ts                      [NEW]
    └── app/api/telemetry/errors/
        └── route.ts                      [NEW — optional]
```

---

## 4. 性能评估

### 4.1 Bundle Impact

| 功能 | 新增依赖 | 估算包体积增量 | 优化策略 |
|------|---------|--------------|---------|
| F001 快捷键 | 无 | ~0 KB | tree-shaken |
| F002 PNG | `html2canvas` | ~45 KB (gzipped ~15 KB) | dynamic import，仅导出时加载 |
| F002 SVG | 无 | ~0 KB | 纯 DOM 序列化 |
| F002 PDF | Worker | ~500 KB (Server-side, 不影响 client bundle) | — |
| F003 Error Boundary | 无 | ~2 KB | 轻量 |
| F004 Zustand persist | `zustand/middleware` | ~3 KB | built-in |
| F005 ThemeProvider | 无 | ~1 KB | CSS vars native |

### 4.2 Runtime Performance

| 场景 | 估算 | 说明 |
|------|------|------|
| 快捷键注册 (F001) | O(n) n=shortcuts | ≤ 10 shortcuts，稳定 |
| Canvas PNG 导出 (F002) | 100-500ms | 取决于 canvas 复杂度 |
| PDF 生成 (F002) | 500ms-2s (server) | CF Workers 冷启动 + 生成 |
| localStorage 读写 (F004) | <5ms | 同步，但数据量小 |
| CSS 变量主题切换 (F005) | <16ms | 单帧内完成 |

### 4.3 Lighthouse 预估影响

| Metric | Sprint 36 基线 | Sprint 37 变化 | 原因 |
|--------|--------------|--------------|------|
| JS Bundle | ~180 KB | +15 KB (html2canvas lazy) | 仅导出时加载 |
| First Contentful Paint | ~1.2s | ±0 | SSR 不变 |
| Time to Interactive | ~2.5s | +50ms (ErrorBoundary 注册) | 可忽略 |

---

## 5. 风险评估

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| html2canvas SSR hydrated mismatch | Medium | Medium | dynamic import + `ssr: false` + null guard |
| PDF Worker 部署失败 (CF Workers size limit) | Low | Medium | Fallback: `window.print()` 触发浏览器 PDF |
| 主题切换闪烁 (FOUC) | Medium | Low | CSS vars applied before JS; `data-theme` on `<html>` |
| localStorage 存储配额 (rare) | Low | Low | 偏好数据 < 10KB，quota ~5MB，正常不会满 |
| 快捷键与浏览器快捷键冲突 | Medium | Medium | `preventDefault()` + ignoreWhen for input fields |
| 快捷键与辅助功能冲突 | Low | Medium | 通过 `aria-keyshortcuts` 暴露；尊重 OS-level 快捷键 |
| Error Boundary 吞掉开发期错误 | Low | Low | Dev 模式下 ErrorBoundary 仅 log，不 render fallback |
| DDSToolbar ExportMenu 与现有 toolbar 冲突 | Low | Low | 直接在现有 toolbar.tsx 中嵌入，不新增顶层组件 |

---

## 6. 兼容性 & 向后兼容

1. **所有现有功能不受影响**：快捷键仅在 `DDSCanvasPage` 内非文本输入时生效
2. **Canvas 导出**：新增 PNG/SVG/PDF 不影响现有 JSON/Vibex 导出
3. **Theme**：默认 `system` 主题保持与当前 CSS 完全一致
4. **Preferences**：`version: 1` 的 localStorage schema，首次访问无数据时使用默认值
5. **Error Boundary**：Dev 模式下抛出 `console.error` 不触发 fallback，保证开发体验
