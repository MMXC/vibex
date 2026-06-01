# Sprint 47 Implementation Partition — 执行计划

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **Epic 数量**: 5 (E1-E5)

---

## Pipeline Order

```
E1 (AI 搜索) → E2 (快捷键) → E3 (复制/粘贴) → E4 (画布列表) → E5 (导出扩展)
```

**约定**: 所有 dev 派发到 `origin/epic/s47-e{N}-<name>` 分支（从 `origin/main` 创建）。

---

## Epic 1 — E1: AI Session 搜索 + 历史会话管理

**代码目录**: `vibex-fronted/src/stores/agentStore.ts`

**文件变更**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/stores/agentStore.ts` | 修改 | 已有 searchableText 字段，确认实现 |
| `src/components/ai/AgentSessions.tsx` | 修改 | 增加搜索输入框 + 过滤逻辑 |
| `src/hooks/__tests__/useAgentStore.test.ts` | 新增 | 搜索状态测试 |

**DoD checklist**:
- [ ] `searchableText` 字段在 session 创建/更新时自动填充
- [ ] AgentSessions 搜索输入框 UI
- [ ] 实时关键词过滤
- [ ] 搜索结果高亮
- [ ] Vitest: 6 tests PASS
- [ ] dual-CHANGELOG 更新

**测试命令**: `npx vitest run src/stores/__tests__/agentStore.test.ts`

---

## Epic 2 — E2: 键盘快捷键系统

**代码目录**: `vibex-fronted/src/hooks/useKeyboardShortcuts.ts`

**文件变更**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/hooks/useKeyboardShortcuts.ts` | 确认 | 已有 542L，确认 ShortcutPanel 入口 |
| `src/components/canvas/features/ShortcutPanel.tsx` | 新增 | 快捷键列表面板 UI |
| `src/i18n/messages/en.json` | 修改 | 新增 `shortcuts` namespace |
| `src/i18n/messages/zh.json` | 修改 | 同步中文 keys |
| `src/components/__tests__/ShortcutPanel.test.tsx` | 修改 | 已有 126L 测试文件 |

**DoD checklist**:
- [ ] ShortcutPanel.tsx 显示所有可用快捷键
- [ ] `Cmd+S` → saveCanvas() 绑定
- [ ] `Cmd+K` → 打开 AI 面板绑定
- [ ] `Cmd+Shift+Z` → 重做绑定
- [ ] 冲突检测 → console.warn
- [ ] `shortcuts` i18n namespace 建立
- [ ] Vitest: 覆盖测试
- [ ] dual-CHANGELOG 更新

---

## Epic 3 — E3: 画布节点复制/粘贴

**代码目录**: `vibex-fronted/src/stores/`

**文件变更**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/stores/clipboardStore.ts` | 新增 | Zustand store，存储序列化节点 |
| `src/lib/canvas/stores/flowStore.ts` | 修改 | 新增 copyNodes + pasteNodes actions |
| `src/hooks/useCanvasCopyPaste.ts` | 新增 | Cmd+C/V 快捷键绑定 hook |
| `src/stores/__tests__/clipboardStore.test.ts` | 新增 | clipboard 测试 |
| `src/hooks/__tests__/useCanvasCopyPaste.test.ts` | 新增 | copy/paste hook 测试 |

**DoD checklist**:
- [ ] clipboardStore 序列化/反序列化
- [ ] `copyNodes(selectedIds)` → clipboardStore
- [ ] `pasteNodes(targetCanvasId)` → 创建新节点 + crypto.randomUUID() 新 ID
- [ ] Cmd+C / Cmd+V 绑定到节点选中状态
- [ ] 跨画布粘贴正确处理
- [ ] Vitest: 6+ tests PASS
- [ ] dual-CHANGELOG 更新

---

## Epic 4 — E4: Canvas 列表视图 + 多画布管理面板

**代码目录**: `vibex-fronted/src/`

**文件变更**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/stores/canvasListStore.ts` | 新增 | Zustand store，画布列表元数据 |
| `src/components/canvas/CanvasListPanel.tsx` | 新增 | 侧边栏画布列表 UI |
| `src/hooks/__tests__/useCanvasList.test.ts` | 新增 | 画布列表测试 |
| `src/lib/canvas/thumbnail.ts` | 新增 | canvas.toDataURL() 缩略图生成 |

**DoD checklist**:
- [ ] CanvasListPanel 显示所有画布缩略图 + 名称
- [ ] 新建画布按钮
- [ ] 删除画布 + 确认 dialog
- [ ] 双击重命名
- [ ] 按名称/修改时间排序
- [ ] IndexedDB 画布列表读取
- [ ] Vitest: 覆盖测试
- [ ] dual-CHANGELOG 更新

---

## Epic 5 — E5: Canvas 导出格式扩展

**代码目录**: `vibex-fronted/src/components/dds/toolbar/ExportMenu.tsx`

**文件变更**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/dds/toolbar/ExportMenu.tsx` | 修改 | 已有 277L，扩展 Figma 格式 |
| `src/hooks/canvas/useCanvasExport.ts` | 修改 | 扩展 exportAsFigma() |
| `src/hooks/__tests__/useCanvasExport.test.ts` | 修改 | 新增 Figma 测试 |

**DoD checklist**:
- [ ] `exportAsFigma()` 生成 Figma 兼容 JSON
- [ ] ExportMenu 显示 PNG / SVG / Figma 三个选项
- [ ] PNG 分辨率选择（1x / 2x / 3x）
- [ ] SVG 保持矢量语义
- [ ] Vitest: 覆盖测试
- [ ] dual-CHANGELOG 更新

---

## 测试策略

| Epic | 测试文件 | 预期 |
|------|---------|------|
| E1 | `agentStore.test.ts` | 6 tests |
| E2 | `ShortcutPanel.test.tsx` | 覆盖 |
| E3 | `clipboardStore.test.ts` + `useCanvasCopyPaste.test.ts` | 6+ tests |
| E4 | `useCanvasList.test.ts` | 覆盖 |
| E5 | `useCanvasExport.test.ts` | 覆盖 |

**回归测试**: `npx vitest run src/stores/dds/__tests__/DDSCanvasStore.test.ts` (49 tests)

---

## 分支约定

```
origin/epic/s47-e1-ai-session-search       (from origin/main)
origin/epic/s47-e2-keyboard-shortcuts       (from origin/main)
origin/epic/s47-e3-canvas-copy-paste       (from origin/main)
origin/epic/s47-e4-canvas-list             (from origin/main)
origin/epic/s47-e5-export-extensions       (from origin/main)
```

**Commit 格式**: `feat(S47-P00X-EY): <description>`

---

## Vitest 运行命令参考

```bash
cd vibex-fronted
npx vitest run src/stores/__tests__/agentStore.test.ts
npx vitest run src/components/__tests__/ShortcutPanel.test.tsx
npx vitest run src/stores/__tests__/clipboardStore.test.ts
npx vitest run src/hooks/__tests__/useCanvasCopyPaste.test.ts
npx vitest run src/hooks/__tests__/useCanvasList.test.ts
npx vitest run src/hooks/__tests__/useCanvasExport.test.ts
```

**TypeScript 验证**: `pnpm exec tsc --noEmit --skipLibCheck <files>`
