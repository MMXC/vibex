# AGENTS.md — Sprint 45 协作规范

---

## 角色定义

### dev (开发工程师)
- 负责所有 5 个 Epic 的实现
- 分支命名: `epic/s45-e{N}-{short-name}`
- 每个 Epic 实现后更新 dual-CHANGELOG
- 提交信息格式: `feat(S45-P00X-EY): <简短描述>`

### tester (测试工程师)
- 对每个 Epic 运行 vitest 测试
- 验证 DoD checklist 完成度
- 报告测试失败但不修复

### reviewer (代码审查)
- 验证 DoD 每项打勾
- 检查 dual-CHANGELOG 完整性
- 检查 TypeScript 编译
- 批准后推送到 `origin/main`

---

## 技术栈提醒

- **前端**: Next.js 15 App Router, React 18, TypeScript
- **状态**: Zustand (`src/stores/`)
- **WebSocket**: `vibex-backend/src/routes/websocket.ts` — presence 频道
- **数据库**: Cloudflare D1 (`wrangler d1`)
- **i18n**: `src/i18n/messages/en.json` + `zh.json`
- **@xyflow/react**: `^12.10.1` — 内置 MiniMap/Controls/Background
- **测试**: Vitest (`npx vitest run`) + Playwright E2E

---

## 分支约定

| Epic | 分支 | 目标推送位置 |
|------|------|------------|
| E1 | `origin/epic/s45-e1-ai-reconnect` | origin/main |
| E2 | `origin/epic/s45-e2-presence-cursor` | origin/main |
| E3 | `origin/epic/s45-e3-canvas-minimap` | origin/main |
| E4 | `origin/epic/s45-e4-template-version` | origin/main |
| E5 | `origin/epic/s45-e5-snapshot-share` | origin/main + vibex-backend |

---

## 提交流程

1. `git checkout -b epic/s45-e{N}-<name>`
2. 实现功能
3. `npx vitest run <test-file>` — 确保通过
4. `pnpm exec tsc --noEmit --skipLibCheck` — 确保无 TS 错误
5. 更新 `vibex-fronted/CHANGELOG.md`
6. 更新 `/root/.openclaw/vibex/CHANGELOG.md`（root）
7. `git add . && git commit -m "feat(S45-P00X-EY): <desc>"`
8. `git push origin HEAD:main`（coord self-impl） 或 `git push origin HEAD:epic/s45-e{N}-<name>`（dev agent）

---

## 关键约束

- 所有 i18n key 必须同时写入 en.json 和 zh.json
- `@xyflow/react` 内置组件无需安装额外包
- E5 snapshot API 需要 `wrangler d1 execute` 创建表
- dual-CHANGELOG: root + frontend 两个文件必须同时更新
