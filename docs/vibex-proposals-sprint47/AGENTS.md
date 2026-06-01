# Sprint 47 AGENTS.md — Agent Role Definitions

> **日期**: 2026-05-31
> **Sprint**: 47 (P001-P005)
> **Epic 数**: 5

---

## Dev Agent

### Role
实现 E1-E5 各 Epic 功能代码。

### Branch Convention
每个 Epic 从 `origin/main` 创建独立分支:
```bash
git checkout -b epic/s47-e1-ai-session-search origin/main
git checkout -b epic/s47-e2-keyboard-shortcuts origin/main
git checkout -b epic/s47-e3-canvas-copy-paste origin/main
git checkout -b epic/s47-e4-canvas-list origin/main
git checkout -b epic/s47-e5-export-extensions origin/main
```

### Commit Format
```
feat(S47-P001-E1): add searchableText to agentStore
feat(S47-P002-E2): implement ShortcutPanel component
feat(S47-P003-E3): add clipboardStore with copyNodes/pasteNodes
feat(S47-P004-E4): add CanvasListPanel with thumbnail generation
feat(S47-P005-E5): add Figma export format support
```

### Code Style
- TypeScript strict mode
- Zustand stores: `src/stores/` (canvas-level) or `src/stores/dds/`
- Canvas stores: `src/lib/canvas/stores/`
- Hooks: `src/hooks/`
- i18n: 双括号 `useTranslations('ns')()`
- i18n path: `src/i18n/messages/en.json` + `zh.json`
- **禁止** 内联 style，使用 CSS variables from design-tokens.css

### DoD 交付标准
每个 Epic 必须:
1. 实现所有功能代码
2. 编写 Vitest 测试（> 80% 覆盖率）
3. 更新 `vibex-fronted/CHANGELOG.md`（S47-Ex 格式）
4. 更新 `/root/.openclaw/vibex/CHANGELOG.md`（root CHANGELOG）
5. `pnpm exec tsc --noEmit --skipLibCheck` 无错误

---

## Tester Agent

### Role
验证 Dev Epic 功能实现，运行 Vitest，执行 E2E 冒烟测试。

### Verification Commands
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run src/stores/__tests__/agentStore.test.ts        # E1
npx vitest run src/components/__tests__/ShortcutPanel.test.tsx # E2
npx vitest run src/stores/__tests__/clipboardStore.test.ts    # E3
npx vitest run src/hooks/__tests__/useCanvasList.test.ts      # E4
npx vitest run src/hooks/__tests__/useCanvasExport.test.ts    # E5
npx vitest run src/stores/dds/__tests__/DDSCanvasStore.test.ts  # regression (49 tests)
```

### Regression Check
所有 Epic 实现后必须运行 DDSCanvasStore 回归测试:
```bash
npx vitest run src/stores/dds/__tests__/DDSCanvasStore.test.ts
```
Exit 0 + all pass = 通过。任何 FAIL = 阻塞。

### E2E Smoke Test
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx playwright test --grep="smoke" --project=chromium
```

---

## Reviewer Agent

### Role
审查 Dev + Tester 的代码质量、测试覆盖、文档完整性。

### Review Checklist
每个 Epic 验收:
- [ ] Dev 代码符合 architecture.md 决策
- [ ] Vitest 全部 PASS
- [ ] dual-CHANGELOG 更新（S47-Ex 格式）
- [ ] 无 TypeScript 错误
- [ ] 测试覆盖 > 80%

### CHANGELOG 格式
Frontend `vibex-fronted/CHANGELOG.md`:
```markdown
## [Unreleased]

### S47-E1 (2026-05-31)
- feat(S47-P001-E1): AI Session searchableText + 搜索 UI
```

Root `/root/.openclaw/vibex/CHANGELOG.md`:
```markdown
## [Unreleased]

### S47-E1 (2026-05-31)
- feat(S47-P001-E1): AI Session searchableText + 搜索 UI
```

---

## Reviewer-Push Agent

### Role
将 Epic 分支合并到 `origin/main`，验证合并无冲突。

### Push Sequence
```bash
git checkout main
git pull origin main
git merge origin/epic/s47-e1-ai-session-search
git push origin main
```

### Verification
合并后检查:
- `git log origin/main --oneline | grep S47` — S47 Epic 出现在 main
- 无合并冲突
- dual-CHANGELOG 格式正确

---

## Coord

### Phase1 Self-Implement
当 analyst / pm / architect 为 CLI-dispatch ghost（`updatedBy: cli`）时，coord 自举实现:
1. 读取 prior sprint 输出 + CHANGELOG
2. 生成当前 sprint 提案 / PRD / architecture
3. `task update <stage> in-progress` → 写入文件 → `task update <stage> done`

### Phase2 Self-Implement
当 dev / tester / reviewer 为 CLI-dispatch ghost 时:
1. 验证上游代码状态（git + vitest）
2. 自实现剩余功能
3. 完整 pipeline 推进（dev → tester → reviewer → reviewer-push）
4. Push 到 `origin/main`
5. 更新 dual-CHANGELOG

### Sprint Completion
当所有 E1-E5 完成:
1. 经验沉淀到 `docs/.learnings/sprint47.md`
2. `task update vibex-proposals-sprint47 coord-completed done`
3. 检查下一 Sprint 依赖条件
