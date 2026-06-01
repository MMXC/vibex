# Sprint 46 AGENTS.md

## 角色定义

### Dev Agent
- 每次实现一个 Epic
- 遵循 DoD checklist
- commit message 格式: `feat(S46-P00X-EY): <description>`
- dual-CHANGELOG 更新: root + frontend 两个文件

### Tester Agent
- 每个 Epic 实现后派发
- 运行 Vitest: `cd vibex-fronted && npx vitest run <test-file>`
- E2E spec（如有）: `pnpm exec tsc --noEmit --skipLibCheck <spec-files>`（不运行 playwright）
- 报告: vitest pass count + TypeScript clean

### Reviewer Agent
- 验证 DoD checklist 每项
- 检查 dual-CHANGELOG 完整性
- 检查 vitest 通过

---

## 技术栈提醒

- `useTranslations('ns')()` 双括号调用
- i18n 文件: `vibex-fronted/src/i18n/messages/en.json` + `zh.json`
- `shortcuts` i18n namespace 已有3 key，需补充
- `ai` i18n namespace 已有26 key
- `@xyflow/react ^12.10.1` 内置 MiniMap/Controls/Background
- Zustand store: 新建 `clipboardStore.ts`, `canvasMetaStore.ts`
- IndexedDB: `sessions` 表增字段（向后兼容），新建 `canvasMeta` 表
- localStorage clipboard TTL: 5分钟

## 分支约定

- Dev agent: `git checkout -b epic/s46-e{N}-<name> origin/main`
- Coord self-impl: `git push origin HEAD:main`

## 工作目录

- 代码: `/root/.openclaw/vibex/vibex-fronted/`
- i18n: `/root/.openclaw/vibex/vibex-fronted/src/i18n/messages/`
- Vitest: `cd vibex-fronted && npx vitest run src/...`
