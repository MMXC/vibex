# AGENTS.md — proposals-20260401-6

**项目**: proposals-20260401-6 — 全面收尾 + 质量加固
**角色**: Solution Architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 执行摘要

本文档定义 proposals-20260401-6 项目中各 Agent 的执行约束、职责边界和技术决策。三个 Epic 的技术约束已固化，确保 Dev Agent 实现路径唯一、质量目标明确。

| Agent | 职责范围 | Epic |
|-------|----------|------|
| Dev Agent | E1 导出实现 + E3 文档 + E2 修复 | E1, E2, E3 |
| Tester Agent | E1 E2E + E2 单元 + E3 测试 | E1, E2, E3 |
| Reviewer Agent | 代码审查 + 质量把关 | E1, E2, E3 |

---

## Epic 1 — PNG/SVG 批量导出: Dev Agent 约束

### 核心约束

| # | 约束项 | 说明 |
|---|--------|------|
| C1.1 | **必须使用 html2canvas** | PNG 导出必须使用 `html2canvas@^1.4.1`，禁止使用 dom-to-image |
| C1.2 | **必须使用 JSZip** | ZIP 压缩必须使用 `jszip@^3.10.1`，禁止使用 fflate 或其他压缩库 |
| C1.3 | **必须使用 XMLSerializer** | SVG 导出必须使用原生 `XMLSerializer`，禁止使用第三方 SVG 序列化库 |
| C1.4 | **禁止自定义 Canvas 渲染** | 不得自行实现 canvas.getContext + drawImage，必须依赖 html2canvas |
| C1.5 | **禁止自定义 ZIP 压缩** | 不得使用 Node.js 原生 `zlib`，必须使用 JSZip 跨浏览器兼容 API |

### E1 实现规范

#### PNG 导出实现路径

```typescript
// ✅ 正确做法: 严格遵循架构约束
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

class PNGExporter implements IPNGExporter {
  async export(nodeId: string, options: PNGExportOptions): Promise<Blob> {
    const element = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (!element) throw new Error(`Node not found: ${nodeId}`);

    const canvas = await html2canvas(element as HTMLElement, {
      scale: options.scale ?? 2,
      backgroundColor: options.backgroundColor ?? null,
      useCORS: true,
      logging: false,
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob(resolve, 'image/png');
    });
  }
}

// ❌ 错误做法: 禁止
// class PNGExporter {
//   async export(nodeId: string) {
//     const ctx = canvas.getContext('2d');  // 禁止: 自行渲染
//     // ...
//   }
// }
```

#### SVG 导出实现路径

```typescript
// ✅ 正确做法: 使用 XMLSerializer
class SVGExporter implements ISVGExporter {
  async export(nodeId: string, options: SVGExportOptions): Promise<Blob> {
    const svgElement = document.querySelector(`[data-node-id="${nodeId}"] svg`);
    if (!svgElement) throw new Error(`SVG not found for node: ${nodeId}`);

    const serializer = new XMLSerializer();
    let svgStr = serializer.serializeToString(svgElement);

    if (options.inlineCSS) {
      svgStr = this.inlineCSSVariables(svgStr, svgElement as SVGSVGElement);
    }

    return new Blob([svgStr], { type: 'image/svg+xml' });
  }
}

// ❌ 错误做法: 禁止
// import { svgAsDataUri } from 'some-other-lib';  // 禁止: 自行引入库
```

#### ZIP 导出实现路径

```typescript
// ✅ 正确做法: 使用 JSZip 链式 API
class ZipExporter implements IZipExporter {
  async createZip(files: ZipFileEntry[], options: ZipOptions): Promise<Blob> {
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.name, file.blob);
    }

    // JSZip generateAsync with progress
    const blob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: options.compressionLevel ?? 6 },
      },
      (metadata) => {
        options.onProgress?.(metadata.percent, 100);
      }
    );

    return blob;
  }
}

// ❌ 错误做法: 禁止
// import { zip } from 'fflate';  // 禁止: 必须用 JSZip
// import zlib from 'zlib';  // 禁止: 不得直接使用 Node zlib
```

### E1 输出契约

| 产出物 | 格式要求 |
|--------|----------|
| `src/services/export/ExportService.ts` | 必须实现 `exportPNG`, `exportSVG`, `exportZip` 方法 |
| `src/services/export/PNGExporter.ts` | 必须依赖 html2canvas |
| `src/services/export/SVGExporter.ts` | 必须使用 XMLSerializer |
| `src/services/export/ZipExporter.ts` | 必须使用 JSZip |
| ZIP 文件结构 | 必须包含 `manifest.json` 和 `nodes/` 目录 |
| 导出选项 UI | 面板必须包含 PNG、SVG、ZIP 三个选项 |

### E1 测试约束

| 测试类型 | 工具 | 约束 |
|----------|------|------|
| 单元测试 | Jest | PNGExporter、SVGExporter、ZipExporter 核心方法覆盖率 > 80% |
| E2E 测试 | Playwright | 必须覆盖 PNG/SVG/ZIP 三种导出路径 |

---

## Epic 2 — 代码质量审查: Dev Agent 约束

### 核心约束

| # | 约束项 | 说明 |
|---|--------|------|
| C2.1 | **TS strict 模式零错误** | `npx tsc --noEmit` 必须输出 0 error，warning 允许但需记录 |
| C2.2 | **ESLint 零警告** | `npx eslint src/` 必须输出 0 warning |
| C2.3 | **键盘快捷键唯一性** | 全局快捷键 (Ctrl+G) 和 Alt+1/2/3 在各 scope 必须无冲突 |
| C2.4 | **rAF 必须有 cleanup** | 每个 `requestAnimationFrame` 调用必须在同作用域/组件中有对应 `cancelAnimationFrame` |
| C2.5 | **addEventListener 必须有 cleanup** | 每个 `addEventListener` 调用必须在组件卸载时有对应 `removeEventListener` |
| C2.6 | **禁止抑制 TS 错误** | 不得使用 `// @ts-ignore` 或 `// @ts-expect-error` 抑制错误 |

### E2 实现规范

#### TypeScript 严格模式

```json
// tsconfig.json (必须严格模式配置)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

```bash
# ✅ 正确做法: 零错误通过
npx tsc --noEmit
# exit code: 0

# ❌ 错误做法: 禁止
# npx tsc --noEmit 2>&1 | grep "error TS"  # 发现错误后继续
# // @ts-ignore  // 禁止: 抑制错误
```

#### ESLint 零警告

```bash
# ✅ 正确做法: 零警告通过
npx eslint src/ --max-warnings=0
# exit code: 0

# ❌ 错误做法: 禁止
# npx eslint src/ --max-warnings=10  // 禁止: 允许警告
# // eslint-disable-next-line  // 禁止: 抑制警告
```

#### 键盘快捷键唯一性

```typescript
// ✅ 正确做法: 全局唯一，无冲突
export const SHORTCUTS = {
  GLOBAL: {
    SAVE: { keys: ['Ctrl', 'S'], action: 'save' },
    HELP: { keys: ['Ctrl', '?'], action: 'help' },
    UNDO: { keys: ['Ctrl', 'Z'], action: 'undo' },
  },
  CANVAS: {
    ZOOM_IN: { keys: ['Ctrl', '='], action: 'zoomIn' },
    ZOOM_OUT: { keys: ['Ctrl', '-'], action: 'zoomOut' },
    CENTER: { keys: ['Ctrl', '0'], action: 'centerView' },
  },
  PANEL: {
    NODE_PANEL: { keys: ['Ctrl', '1'], action: 'toggleNodePanel', scope: 'panel' },
    EXPORT_PANEL: { keys: ['Ctrl', '2'], action: 'toggleExportPanel', scope: 'panel' },
  },
};

// ❌ 错误做法: 禁止
// Ctrl+G 同时定义在 GLOBAL 和 CANVAS → 冲突
// Alt+1 同时定义在 PANEL_A 和 PANEL_B → 跨 scope 冲突需评估
```

#### rAF cleanup 规范

```typescript
// ✅ 正确做法: rAF 有对应 cancelAnimationFrame
class AnimationComponent {
  private rafId: number | null = null;

  start(): void {
    const tick = () => {
      this.update();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);  // ✅ 必须有 cleanup
      this.rafId = null;
    }
  }
}

// ❌ 错误做法: 禁止
// requestAnimationFrame(() => { ... });  // 无 cleanup
```

#### addEventListener cleanup 规范

```typescript
// ✅ 正确做法: addEventListener 有对应 removeEventListener
class InteractiveComponent {
  private handlers: Map<string, EventListener> = new Map();

  attach(): void {
    const handler = () => this.onClick();
    this.handlers.set('click', handler);
    window.addEventListener('click', handler);
  }

  detach(): void {
    this.handlers.forEach((handler, eventType) => {
      window.removeEventListener(eventType, handler);  // ✅ 必须有 cleanup
    });
    this.handlers.clear();
  }
}

// ❌ 错误做法: 禁止
// element.addEventListener('click', handler);  // 无 removeEventListener
```

### E2 输出契约

| 产出物 | 格式要求 |
|--------|----------|
| `src/services/code-quality/TSChecker.ts` | 调用 `tsc --noEmit`，解析 JSON 输出 |
| `src/services/code-quality/ESLintChecker.ts` | 调用 `eslint`，解析 JSON 输出 |
| `src/services/code-quality/KeyboardChecker.ts` | 扫描 shortcuts.ts，检测冲突 |
| `src/services/code-quality/MemoryLeakChecker.ts` | 扫描源文件，检测 rAF + addEventListener cleanup |
| `src/services/code-quality/CodeQualityChecker.ts` | Facade 整合 4 个检查器 |

---

## Epic 3 — 用户手册文档: Dev Agent 约束

### 核心约束

| # | 约束项 | 说明 |
|---|--------|------|
| C3.1 | **必须使用 Markdown 格式** | docs/user-guide.md 必须为纯 Markdown，禁止 HTML 或其他格式 |
| C3.2 | **操作说明 >= 5** | 文档必须包含至少 5 个可执行操作说明 |
| C3.3 | **章节数 >= 10** | 文档必须至少包含 10 个章节 |
| C3.4 | **必须覆盖 E1 导出功能** | 用户手册必须包含 PNG/SVG/ZIP 导出操作说明 |
| C3.5 | **/help 端点为 REST GET** | `/help` 端点必须为 GET 方法，返回 JSON 或 HTML |
| C3.6 | **Help 按钮必须可点击** | UI 中必须有 Help 按钮链接到 /help 页面 |

### E3 实现规范

#### 用户手册格式规范

```markdown
<!-- ✅ 正确格式: 纯 Markdown -->
# VibeX 用户手册

## 画布操作
### 平移画布
**操作**: 鼠标滚轮 / 空格 + 拖拽
**快捷键**: Ctrl + 方向键

### 缩放画布
**操作**: Ctrl + 滚轮
**快捷键**: Ctrl + = / Ctrl + -

<!-- ❌ 错误格式: 禁止 -->
<!-- <div class="section">HTML 混用</div>禁止 -->
```

#### 操作计数规范

每个操作说明必须包含以下结构:

```markdown
### [操作名称]
**前提条件**: [执行操作前的必要条件]
**操作步骤**:
1. [步骤 1]
2. [步骤 2]
**预期结果**: [操作成功后的效果]
**快捷键**: [如果有]
```

**最小操作列表 (必须覆盖)**:
1. 画布平移
2. 节点创建
3. PNG 导出
4. SVG 导出
5. ZIP 批量导出
6. 快捷键使用
7. 设置切换
8. 清除缓存

#### /help 端点规范

```typescript
// ✅ 正确做法: GET /help 返回 JSON
app.get('/help', async (req, res) => {
  const guide = await userGuideService.getUserGuide();
  res.json({
    status: 'ok',
    data: {
      title: guide.title,
      version: guide.version,
      toc: guide.toc,
      endpoint: '/help',
    },
  });
});

// ❌ 错误做法: 禁止
// app.post('/help', ...);  // 禁止: 必须是 GET
```

### E3 输出契约

| 产出物 | 格式要求 |
|--------|----------|
| `docs/user-guide.md` | 纯 Markdown，>= 10 章节，>= 5 操作说明 |
| `src/services/documentation/HelpRouter.ts` | 实现 GET /help 路由 |
| `src/services/documentation/UserGuideService.ts` | 提供 getUserGuide, getHelpEndpoint 方法 |
| UI Help 按钮 | 可点击，指向 /help |

---

## Reviewer Agent 审查约束

### E1 审查清单

- [ ] PNGExporter 源码中无 `canvas.getContext` 调用
- [ ] PNGExporter 依赖 `import html2canvas from 'html2canvas'`
- [ ] SVGExporter 使用 `new XMLSerializer()`
- [ ] ZipExporter 使用 `new JSZip()` + `zip.file()` + `generateAsync`
- [ ] ZIP 输出包含 `manifest.json`
- [ ] Playwright E2E 测试覆盖 PNG/SVG/ZIP 三路径

### E2 审查清单

- [ ] `npx tsc --noEmit` 输出中无 `error TS` 字样
- [ ] `npx eslint src/` 输出中无 `warning` 或 `error` 字样
- [ ] 快捷键定义中 Ctrl+G 全局唯一
- [ ] 快捷键定义中 Alt+1/2/3 无 scope 冲突
- [ ] 代码中每个 `requestAnimationFrame` 有对应 `cancelAnimationFrame`
- [ ] 代码中每个 `addEventListener` 有对应 `removeEventListener`
- [ ] 无 `// @ts-ignore` 或 `// eslint-disable` 注释

### E3 审查清单

- [ ] docs/user-guide.md 为纯 Markdown 文件
- [ ] 文档包含至少 5 个操作说明
- [ ] 文档包含至少 10 个章节
- [ ] E1 导出功能 (PNG/SVG/ZIP) 在文档中有说明
- [ ] `/help` GET 端点存在且返回 200
- [ ] UI 中存在可点击的 Help 按钮

---

## CI/CD 集成

### GitHub Actions 流水线

```yaml
# .github/workflows/quality-checks.yml
name: Quality Checks

on: [push, pull_request]

jobs:
  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: TypeScript Check
        run: npx tsc --noEmit --strict
        # 约束: 必须 0 error

  eslint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: ESLint Check
        run: npx eslint src/ --max-warnings=0
        # 约束: 必须 0 warning

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npx playwright install --with-deps
      - name: E2E Tests
        run: npx playwright test tests/e2e/export/
        # 约束: PNG/SVG/ZIP 三路径必须通过

  code-quality-report:
    needs: [typescript, eslint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: Run Code Quality Checker
        run: npx ts-node src/scripts/runCodeQualityCheck.ts
        # 输出: code-quality-report.json
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: code-quality-report
          path: code-quality-report.json
```

### CI Gate 策略

```
PR Merge Gate:
├── TypeScript: 0 error ─────────────────┐
├── ESLint: 0 warning ──────────────────┤
├── E2E Tests: All pass ────────────────┤ → Merge Allowed
├── Code Quality: overall=pass ─────────┤
└── Docs: user-guide.md exists ─────────┘

Gate Failure → PR blocked, developer notified
```

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: proposals-20260401-6
- **执行日期**: 2026-04-01
