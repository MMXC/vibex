# Sprint 46 实现分割计划

> **Agent**: coord
> **日期**: 2026-05-31

---

## Epic DoD Checklists

### E1: AI Session 搜索 + 历史会话管理

**DoD checklist**:
- [ ] IndexedDB `sessions` 表新增 `searchableText: string` 字段
- [ ] `agentStore.createSession()` 写入 `searchableText`
- [ ] `AgentSessions.tsx` 新增搜索输入框
- [ ] 搜索过滤：`sessions.filter(s => s.searchableText.includes(query))`
- [ ] 匹配高亮（`<mark>` 或 CSS highlight class）
- [ ] Vitest: `agentStore` 搜索状态测试
- [ ] dual-CHANGELOG 更新

**测试策略**: Vitest unit test (`agentStore.search.test.ts`)

---

### E2: 键盘快捷键扩展

**DoD checklist**:
- [ ] `useKeyboardShortcuts` 新增 `onSaveCanvas` callback + `Cmd+S` handler
- [ ] `useKeyboardShortcuts` 新增 `onOpenAIPanel` callback
- [ ] `shortcutStore.add()` 冲突检测：`console.warn` 重复 key
- [ ] `ShortcutPanel.tsx` 新增 `Cmd+S` 项
- [ ] `shortcuts` i18n namespace 补充描述文本
- [ ] Vitest: `useKeyboardShortcuts` 测试扩展
- [ ] dual-CHANGELOG 更新

**测试策略**: 扩展现有 `useKeyboardShortcuts.test.ts`

---

### E3: 画布节点复制/粘贴

**DoD checklist**:
- [ ] 新建 `src/stores/clipboardStore.ts`（Zustand + localStorage TTL 5min）
- [ ] `canvasStore` 新增 `copyNodes(nodeIds)` action
- [ ] `canvasStore` 新增 `pasteNodes(targetCanvasId)` action
- [ ] toolbar `DDSToolbar` 新增复制按钮
- [ ] `useKeyboardShortcuts` 新增 `onCopyNodes`/`onPasteNodes` callbacks + Cmd+C/V
- [ ] 跨画布粘贴：目标画布选择 dialog
- [ ] Vitest: `clipboardStore.test.ts` + `canvasStore.copyPaste.test.ts`
- [ ] dual-CHANGELOG 更新

**测试策略**: Vitest unit tests (store actions)

---

## Pipeline 顺序

```
E1 (AI Session 搜索)  →  E2 (快捷键扩展)  →  E3 (节点复制/粘贴)
```

E1 和 E2 无依赖，可并行。E3 依赖 E1 的 `agentStore` 无直接依赖，但为了稳定递进，按 E1→E2→E3 顺序派发。

---

## 已知限制

- 不创建 `[locale]/ai/` 路由（Sprint40 验证不存在，本 sprint 不覆盖）
- 不修改现有 IndexedDB session schema version（向后兼容）
- 不引入新的全局状态管理库（只用 Zustand）
