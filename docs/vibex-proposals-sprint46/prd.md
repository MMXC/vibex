# Sprint 46 PRD — 产品需求文档

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **依据**: analysis.md (P001-P005)

---

## 1. 产品愿景

基于 Sprint45 建立的 AI Session + 协作光标 + MiniMap + 模板版本 + 快照分享能力，Sprint46 聚焦三个核心方向：
1. **AI Session 可发现性**：让用户能找到和管理历史 AI 会话
2. **键盘效率**：为 power user 提供全局快捷键系统
3. **画布操作效率**：节点复制/粘贴，减少重复工作

---

## 2. Epic × Story 验收标准

### Epic 1 — P001: AI Session 搜索 + 历史会话管理

| Story | 验收标准 | expect() 断言 |
|--------|---------|-------------|
| S1.1 搜索索引 | IndexedDB session 有 `searchableText` 字段 | `expect(store.sessions[0]).toHaveProperty('searchableText')` |
| S1.2 搜索 UI | AgentSessions 有搜索输入框 | `expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()` |
| S1.3 过滤逻辑 | 输入关键词后只显示匹配 session | `expect(screen.getAllByRole('listitem')).toHaveLength(1)` |
| S1.4 高亮 | 搜索结果中关键词被高亮 | `expect(screen.getByText(/match/i).className).toContain('highlight')` |

**DoD checklist**:
- [ ] IndexedDB `searchableText` 字段建立
- [ ] 搜索输入框 + 实时过滤
- [ ] 关键词高亮
- [ ] Vitest 覆盖

---

### Epic 2 — P002: 键盘快捷键系统

| Story | 验收标准 | expect() 断言 |
|--------|---------|-------------|
| S2.1 注册表 | useKeyboardShortcuts 支持注册多个快捷键 | `expect(registerShortcut).toBeDefined()` |
| S2.2 Cmd+S | 保存画布触发 | `expect(saveCanvas).toHaveBeenCalled()` |
| S2.3 Cmd+K | 打开 AI 面板 | `expect(setAIPanelOpen).toHaveBeenCalledWith(true)` |
| S2.4 冲突检测 | 同一快捷键冲突时 console.warn | `expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('conflict'))` |
| S2.5 ShortcutPanel | 面板显示所有快捷键列表 | `expect(screen.getByText(/Cmd\+S/)).toBeInTheDocument()` |

**DoD checklist**:
- [ ] `useKeyboardShortcuts` hook（注册表模式）
- [ ] 冲突检测 + warn
- [ ] `Cmd+S` / `Cmd+K` / `Cmd+Shift+Z` 实现
- [ ] ShortcutPanel UI
- [ ] `shortcuts` i18n namespace
- [ ] Vitest 测试

---

### Epic 3 — P003: 画布节点复制/粘贴

| Story | 验收标准 | expect() 断言 |
|--------|---------|-------------|
| S3.1 复制 action | canvasStore.copyNodes 序列化选中节点 | `expect(clipboard).toHaveLength(selectedNodes.length)` |
| S3.2 粘贴 action | pasteNodes 创建新节点 + 新 ID | `expect(newNodes[0].id).not.toEqual(originalId)` |
| S3.3 快捷键 | Cmd+C/V 在节点选中状态可用 | `expect(handleCopy).toHaveBeenCalled()` |
| S3.4 跨画布 | 粘贴到不同 canvasId 创建节点 | `expect(targetCanvasNodes).toHaveLength(1)` |

**DoD checklist**:
- [ ] `copyNodes(nodeIds)` action
- [ ] `pasteNodes(targetCanvasId)` action
- [ ] toolbar 复制按钮
- [ ] Cmd+C/Cmd+V 快捷键
- [ ] 跨画布目标选择器
- [ ] Vitest 测试

---

## 3. 非功能需求

- **性能**: 搜索响应 < 100ms（本地 IndexedDB，无需网络）
- **兼容性**: 键盘快捷键在 macOS/Windows 均可用
- **i18n**: 所有 UI 文本使用 `useTranslations` hook，`shortcuts` namespace 新建
- **Vitest**: 每个 Epic 至少 5 个测试用例

---

## 4. 技术约束

- 不修改 IndexedDB schema version（向后兼容）
- 不引入新的全局状态（扩展现有 store）
- 快捷键在 `DDSCanvasPage` 组件 mount 时注册，unmount 时 cleanup
- copyNodes 序列化数据存储在 localStorage（非 IndexedDB），TTL 5 分钟

---

## 5. 依赖关系

```
Epic1 (AI Session 搜索)     ← 独立，依赖 Sprint45 E1 IndexedDB 基础设施
Epic2 (键盘快捷键)          ← 独立，依赖 Sprint44 E5 触控手势基础设施
Epic3 (节点复制/粘贴)        ← 依赖 Epic1（搜索索引），可与 Epic1 并行
Epic4 (Canvas 列表)         ← P1，不在 Sprint46 Scope
Epic5 (导出扩展)            ← P2，不在 Sprint46 Scope
```

**Sprint46 实施范围**: Epic1 + Epic2 + Epic3（5 Epics 缩减为 3）
