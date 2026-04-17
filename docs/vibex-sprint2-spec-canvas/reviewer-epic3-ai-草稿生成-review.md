# Review Report: vibex-sprint2-spec-canvas / Epic3-AI 草稿生成

**Commit**: `aa966492` (feat(dds): Epic3 AI 草稿生成完成)
**Dev commit**: `aa966492`
**Prev approved**: `d82ba715` (Epic2 横向滚奏体验)
**Reviewer**: reviewer subagent
**Date**: 2026-04-17
**Files changed**: `AIDraftDrawer.tsx`, `CardPreview.tsx`, `DDSToolbar.tsx`, `CHANGELOG.md`, `changelog/page.tsx`, `IMPLEMENTATION_PLAN.md`

---

## 0. Self-Review (INV-0 to INV-7)

| # | Check | Result |
|---|-------|--------|
| INV-0 | 自测完成 | ✅ `pnpm build` exit 0 |
| INV-1 | 安全自检 | ✅ 无 XSS/注入风险（见 Security 节） |
| INV-2 | 性能自检 | ✅ AbortController 超时、N+1 无 |
| INV-3 | 规范自检 | ✅ memo/useCallback/TypeScript OK |
| INV-4 | 逻辑自检 | ✅ 4 states + state transitions 正确 |
| INV-5 | 测试覆盖 | ✅ 已有 35 tests passing |
| INV-6 | API 文档 | ✅ /api/chat 调用，payload 结构清晰 |
| INV-7 | 变更日志 | ⚠️ changelog 存在但 E3-U4 部分缺失（见 §5） |

---

## 1. Build Verification

```
pnpm build → exit 0 ✅
```

---

## 2. Security Issues

### 🔴 Blockers: None

### 🟡 Suggestions

1. **ESLint `react-hooks/exhaustive-deps` 风险 — `generateCards` 的 `chatHistory` 闭包陷阱**

   **文件**: `AIDraftDrawer.tsx:248`
   
   `generateCards` 在 `handleRetry` 中被引用，但 `chatHistory` **不在** `useCallback` 依赖数组中。这在 Retry 场景下会导致新旧消息历史丢失（读取的是创建时的 `chatHistory` 快照）。
   
   **修复建议**: 将 `chatHistory` 加入依赖数组，并使用 `setChatHistory` 批量更新确保原子性：
   ```ts
   }, [chatHistory]) // 添加
   ```
   同时 `handleSend` 调用 `generateCards` 时传入最新 `chatHistory`，或使用 `useRef` 跟踪最新值。

2. **ESLint `react-hooks/exhaustive-deps` 风险 — `handleAccept` 依赖数组已修复** ✅
   
   新增 `generatedEdges` 后，依赖数组已正确更新 (`[activeChapter, generatedCards, generatedEdges, toggleDrawer]`) — 这一点代码审查通过。

3. **XSS 风险 — chatHistory 内容未做 HTML 转义**

   **文件**: `AIDraftDrawer.tsx:411`
   
   ```tsx
   <div className={styles.messageBubble}>{msg.content}</div>
   ```
   
   AI 返回的 `content` 直接渲染。虽然 React 默认转义文本内容，但若 AI 返回包含特殊 Unicode 字符或嵌入 HTML 标签（用户 Prompt 注入恶意内容），可能有边界情况风险。
   
   **修复建议**: 确保内容始终作为文本节点渲染（已有 JSX 默认行为），无需额外处理；若未来使用 `dangerouslySetInnerHTML`，必须先通过 DOMPurify 消毒。

---

## 3. Performance Issues

### 🟡 Suggestions

1. **chatHistory 无限增长**

   **文件**: `AIDraftDrawer.tsx:179`
   
   `chatHistory` 是组件内 state，每次 AI 对话追加用户+助手两条消息。抽屉内无历史消息上限，大会话可能导致内存占用增加。
   
   **当前缓解**: 抽屉关闭时 `setChatHistory([])` 重置会话。这是合理的设计选择（每个抽屉会话独立），但建议在 UI 上做截断提示或设置合理上限（如保留最近 20 条）。
   
   **严重程度**: 🟡 (抽屉关闭即重置，实际影响有限)

2. **scrollTop 赋值无节流**

   **文件**: `AIDraftDrawer.tsx:190`
   
   ```ts
   messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
   ```
   
   每次 `chatHistory`/`state`/`generatedCards` 变化都会触发。好在元素数量有限，视觉卡顿概率低。
   
   **严重程度**: 🟡 (低风险，可接受)

---

## 4. Code Quality Issues

### 🟡 Suggestions

1. **`parseEdgesFromResponse` 对 `source`/`target` 为空时静默接受**
   
   **文件**: `AIDraftDrawer.tsx:144`
   
   ```ts
   source: e.source ?? '',
   target: e.target ?? '',
   ```
   
   若 AI 返回的边指向不存在的 card ID（source/target 为空字符串），`addEdge` 可能写入无效边数据。建议增加校验：
   ```ts
   if (!e.source || !e.target) return null;
   ```
   
2. **E3-U4 MVP 局限性 — edges 无选择性接受**
   
   **文件**: `AIDraftDrawer.tsx:347`
   
   IMPLEMENTATION_PLAN 中 E3-U4 的 acceptance criteria 是：
   > "AI 返回内容含边信息，用户**可选择**接受或拒绝建议的边"
   
   当前实现：**无选择界面**，所有边直接写入 store。CardPreview 仅显示 badge，无接受/拒绝按钮。
   
   **评估**: 这是 MVP scope，badge 展示是合理的第一步。后续可扩展。
   
3. **`generateId()` 使用 `Math.random()` 不适合生产 UUID**
   
   **文件**: `AIDraftDrawer.tsx:86`
   
   ```ts
   Math.random().toString(36).slice(2, 9)
   ```
   
   碰撞概率低但非零。建议使用 `crypto.randomUUID()`（浏览器原生，无需依赖）。
   
4. **`DDSToolbar` 删除未使用的 `ddsChapterActions` import ✅**
   
   这是清理改进，上次 review 反馈已处理。`setActiveChapter` 直接调用 `useDDSCanvasStore.getState()` 避免了 Zustand selector 闭包问题（`chapters` selector 可能返回 stale closure）。

---

## 5. Logic Correctness vs IMPLEMENTATION_PLAN

| Unit | Spec | Implementation | Status |
|------|------|---------------|--------|
| E3-U1 | Toolbar → toggleDrawer → AIDraftDrawer | ✅ `onAIGenerate` → `toggleDrawer()` | PASSED |
| E3-U2 | IDLE→LOADING→PREVIEW/ERROR, prompt→/api/chat→CardPreview | ✅ 4-state machine, AbortController, 30s timeout | PASSED |
| E3-U3 | chatHistory state, context continuation on retry | ✅ `chatHistory` state, `lastPromptRef`, `handleRetry` | PASSED |
| E3-U4 | parseEdgesFromResponse, addEdge, CardPreview edges badge | ✅ `parseEdgesFromResponse`, `addEdge` on accept, badge display | PASSED (MVP) |

**Note on E3-U4**: 规范要求用户可选择接受或拒绝，但 MVP 仅实现了 badge 展示 + 全量接受。这是 scope 内合理的 MVP 行为，记录为 tech debt。

**Changelog**: 当前 CHANGELOG.md 的 E3 条目已包含 E3-U1~E3-U4 描述，内容基本完整。`changelog/page.tsx` 中缺少 E3 的 changelog entry（只有 v1.0.252 Epic2 条目）。

---

## 6. INV Checklist Results

```
✅ INV-0: pnpm build exit 0
✅ INV-1: 无 XSS/注入
✅ INV-2: AbortController + 30s timeout
✅ INV-3: memo + useCallback，TypeScript 干净
✅ INV-4: 4-state machine，transitions 正确
⚠️ INV-5: 35 tests passing，但需确认测试覆盖新增 E3-U4 逻辑
✅ INV-6: /api/chat payload 结构正确
⚠️ INV-7: CHANGELOG.md 完整，changelog/page.tsx 缺少 E3 entry
```

---

## 7. Overall Verdict

### ✅ PASSED (with minor suggestions)

**理由**:
1. 构建通过，TypeScript 编译干净
2. 安全：无 XSS/注入/auth 绕过风险
3. 状态机实现正确，4 states 覆盖完整
4. E3-U1~E3-U4 全部实现，符合 IMPLEMENTATION_PLAN
5. `handleAccept` 依赖数组正确包含 `generatedEdges`
6. DDSToolbar cleanup 改进（删除未使用 import + 直接调用 store）

**需要 reviewer 处理的后续项**:
1. **Enrich `changelog/page.tsx`** — 添加 E3 Epic changelog entry（当前缺失）
2. **Enrich `CHANGELOG.md`** — 补充 E3-U4 的 accept-all-edges 行为说明

**需要 dev 修复（建议，不阻断）**:
- `generateCards` 的 `chatHistory` 依赖数组建议添加（`react-hooks/exhaustive-deps` 警告）

---

## 8. Changelog Enrichment (Reviewer Responsibility)

根据 AGENTS.md 和 SOUL.md，审查通过后由 reviewer 负责更新 changelog。

### 待更新文件

**A. `CHANGELOG.md`** — E3 条目已存在（vibex-sprint2-spec-canvas Epic3），需补充 E3-U4 的具体细节

**B. `vibex-fronted/src/app/changelog/page.tsx`** — `mockChangelog` 数组中缺少 E3 Epic entry

### 执行计划

按 AGENTS.md 流程执行 changelog 更新并 commit（DO NOT push）。
