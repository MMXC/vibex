# Sprint 47 Architecture — 技术架构文档

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **依据**: prd.md (E1-E5), analysis.md (P001-P005)

---

## A. 架构决策

### AD-1: E1 AI Session 搜索 — 增量字段方案

**决策**: 在现有 IndexedDB agentStore 中增加 `searchableText` 字段，不新增独立 Store。

**选项对比**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| A. 独立 searchStore | 隔离性好 | 需要跨 store join，复杂 |
| B. 增量字段（选中） | 改动小，复用现有 store | 写入时需拼接字符串 |
| C. 全文索引（FlexSearch） | 功能强大 | 引入新依赖，包体积增加 |

**决策**: B — `searchableText = session.title + task + firstUserMessage`。在 `agentStore` 写入时拼接，不引入新依赖。

**风险**: 长文本拼接可能超长 → 限制总长度 500 chars。

---

### AD-2: E2 键盘快捷键 — 注册表模式

**决策**: 统一 `useKeyboardShortcuts` hook，使用注册表模式管理所有快捷键。

**现状**: `useKeyboardShortcuts.ts` 已存在（542L），`ShortcutPanel.test.tsx` 已存在。

**待完成**:
- `ShortcutPanel.tsx` UI 组件（目前只有测试文件）
- `shortcuts` i18n namespace
- 冲突检测 warn 逻辑

**技术方案**:
```
keydown → useKeyboardShortcuts → 查找 keyMap → 执行 action
                                      ↓
                               检测冲突 → console.warn
```

---

### AD-3: E3 节点复制/粘贴 — clipboardStore 分离

**决策**: 节点序列化到独立 `clipboardStore`（Zustand），不污染 `canvasStore`。

**现状**: `copyNodes`/`pasteNodes` NOT FOUND — 全量实施。

**数据流**:
```
copyNodes(selectedIds) → canvasStore.nodes 序列化 → clipboardStore
pasteNodes(targetCanvasId) → clipboardStore 反序列化 → 新 ID 生成 → targetCanvasStore
```

**ID 生成策略**: `crypto.randomUUID()` 保证跨画布唯一性。

---

### AD-4: E4 画布列表 — IndexedDB + 缩略图

**决策**: 使用 IndexedDB 存储画布元数据，`canvas.toDataURL()` 生成缩略图。

**现状**: CanvasListPanel NOT FOUND — 全量实施。

**页面路由**: 复用现有 `src/app/flow/page.tsx`（不新增路由），侧边栏 CanvasListPanel。

**数据模型**:
```typescript
interface CanvasMeta {
  id: string;          // UUID
  name: string;        // 用户自定义名
  thumbnail: string;   // base64 PNG (toDataURL)
  createdAt: number;   // timestamp
  updatedAt: number;   // timestamp
  tags?: string[];
}
```

---

### AD-5: E5 导出扩展 — ExportMenu 扩展 vs 新建 service

**决策**: 扩展现有 `ExportMenu.tsx`（277L，已有 PNG/SVG），增加 Figma 格式。

**现状**: PNG ✅, SVG ✅, Figma ❌

**Figma 格式**: 导出 `{ type: 'figma', nodes: [...], version: '1.0' }` JSON 文件，兼容 Figma 的 Import 能力。

---

## B. 技术栈提醒

| 组件 | 技术 |
|------|------|
| 状态管理 | Zustand (`canvasStore`, `clipboardStore`, `agentStore`) |
| 持久化 | IndexedDB (via `idb` or raw) |
| i18n | `useTranslations('ns')()` 双括号 |
| i18n paths | `src/i18n/messages/en.json` + `zh.json` |
| 测试 | Vitest (`npx vitest run <file>`) |
| 包管理 | pnpm |
| 构建 | Next.js 15 App Router |

---

## C. 风险表

| Epic | 风险 | 缓解 |
|------|------|------|
| E1 | searchableText 长文本截断 | 限制 500 chars |
| E2 | 快捷键与浏览器冲突 | Cmd+Option 避免 |
| E3 | 跨画布粘贴节点 ID 冲突 | crypto.randomUUID() |
| E4 | 缩略图性能（大型画布）| canvas.toDataURL 异步 + loading 态 |
| E5 | Figma 格式兼容性 | 基础 JSON 格式，后续迭代 |

---

## D. 依赖关系

```
E1 (AI 搜索)       → agentStore.ts (已有)           [小增量]
E2 (快捷键)        → useKeyboardShortcuts.ts (已有) [UI + i18n 增量]
E3 (复制/粘贴)     → canvasStore (已有)             [全量新功能]
E4 (画布列表)      → 独立                          [全量新功能]
E5 (导出扩展)      → ExportMenu.tsx (已有)         [Figma 增量]
```

**Pipeline order**: E1 → E2 → E3 → E4 → E5（可并行 dev，实际串行派发）
