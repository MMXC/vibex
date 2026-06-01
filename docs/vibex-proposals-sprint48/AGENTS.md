# AGENTS.md — VibeX Sprint 48

> **Date**: 2026-05-31
> **Author**: coord (heartbeat self-implement)
> **Project**: `vibex-proposals-sprint48`

---

## 开发 Agent (dev) 角色定义

### 职责
- 根据 IMPLEMENTATION_PARTITION.md 的 DoD 清单实现每个 Epic
- 遵循 `DESIGN.md` 设计系统（design-tokens.css 变量，禁止内联 style）
- 提交到正确的 epic 分支：`origin/epic/s48-e{N}-{name}`
- 更新 dual-CHANGELOG（root + vibex-fronted）

### 分支约定

| Epic | 分支名 | 基础分支 |
|------|--------|---------|
| E1 | `origin/epic/s48-e1-canvas-list-persist` | 从 `origin/main` 新建 |
| E2 | `origin/epic/s48-e2-pdf-export` | 从 `origin/main` 新建 |
| E3 | `origin/epic/s48-e3-shortcut-config` | 从 `origin/main` 新建 |
| E4 | `origin/epic/s48-e4-session-tags` | 从 `origin/main` 新建 |
| E5 | `origin/epic/s48-e5-cross-canvas-paste` | 从 `origin/main` 新建 |

**重要**: 所有 E{N} 分支需从 `origin/main` 新建（Sprint48 epic 分支未预创建）

### 提交格式
```
feat(S48-P001-E1): add canvas list persistence + search
feat(S48-P001-E2): add PDF export + batch export
feat(S48-P001-E3): add customizable keyboard shortcuts
feat(S48-P001-E4): add AI session tags + favorites
feat(S48-P001-E5): add cross-canvas clipboard paste
```

### 技术栈提醒

| 组件 | 技术 | 备注 |
|------|------|------|
| 状态管理 | Zustand | persist middleware (E1), store actions (E4/E5) |
| PDF 生成 | jsPDF + html2canvas | 已在 package.json (Sprint43) |
| 快捷键 | userPreferencesStore | 已有 shortcutCustomization[] (E3) |
| 测试 | Vitest | `npx vitest run <file>` |
| i18n | `src/i18n/messages/` | 新增 shortcuts.customize 等 keys (E3) |

### 代码检查

```bash
# TypeScript 编译
cd vibex-fronted && pnpm exec tsc --noEmit --skipLibCheck

# Vitest 运行
npx vitest run src/hooks/__tests__/useCanvasList.test.ts
npx vitest run src/hooks/canvas/useCanvasExport.test.ts
npx vitest run src/components/dds/toolbar/ShortcutPanel.test.tsx
npx vitest run src/stores/__tests__/agentStore.test.ts
npx vitest run src/stores/__tests__/clipboardStore.test.ts

# 回归测试
npx vitest run src/stores/dds/__tests__/DDSCanvasStore.test.ts
```

---

## 测试 Agent (tester) 角色定义

### 职责
- 根据 IMPLEMENTATION_PARTITION.md 的 Vitest 测试清单执行测试
- 验证 DoD 清单中的每个 ✅ item
- 若测试失败，提供具体的失败信息 + 预期值

### 验证顺序
1. Epic-specific 测试（每个 Epic 一个）
2. 回归测试（DDSCanvasStore.test.ts）
3. TypeScript 编译检查

### 失败处理
- 测试失败 → 在 Slack 回复中标注：`❌ FAIL: <test name> — expected X, got Y`
- 若 dev 提交遗漏测试文件 → 报告 `⚠️ MISSING: <test file>`

---

## 审查 Agent (reviewer) 角色定义

### 职责
- 验证 dev commit 内容与 DoD 清单一致
- 检查 dual-CHANGELOG 是否更新（S48-E{N} entries in both root + vibex-fronted）
- 验证分支 push 是否成功

### 审查清单

| 检查项 | 验证方式 |
|--------|---------|
| 代码功能 | Vitest 运行通过 |
| 设计规范 | `DESIGN.md` 合规，无内联 style |
| CHANGELOG (frontend) | `vibex-fronted/CHANGELOG.md` 包含 S48-P001-E{N} |
| CHANGELOG (root) | `CHANGELOG.md` 包含 S48-P001-E{N} |
| 分支 push | `git branch -r --contains <commit>` 显示 epic 分支 |

### Reviewer 提交格式
```
review(S48-P001-E1): verify canvas list persistence
docs(S48-P001-E1): update dual-CHANGELOG for E1
```
