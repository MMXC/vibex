# AGENTS.md — VibeX Sprint 39

## 项目信息

- **Sprint**: vibex-proposals-sprint39
- **Workspace**: /root/.openclaw/vibex
- **代码目录**: /root/.openclaw/vibex/vibex-fronted
- **Backend**: /root/.openclaw/vibex/vibex-backend
- **分析文档**: /root/.openclaw/vibex/docs/vibex-proposals-sprint39/analysis.md
- **PRD**: /root/.openclaw/vibex/docs/vibex-proposals-sprint39/prd.md
- **Architecture**: /root/.openclaw/vibex/docs/vibex-proposals-sprint39/architecture.md
- **IMPLEMENTATION_PLAN**: /root/.openclaw/vibex/docs/vibex-proposals-sprint39/IMPLEMENTATION_PARTITION.md

---

## Agent 角色

### dev

**职责**: 按照 IMPLEMENTATION_PARTITION.md 的 DoD checklist 实现每个 Epic 的功能代码。

**工作流程**:
1. 阅读 `docs/vibex-proposals-sprint39/IMPLEMENTATION_PARTITION.md` 对应 Epic 章节
2. 阅读 `docs/vibex-proposals-sprint39/prd.md` 对应 Epic 章节
3. 阅读 `docs/vibex-proposals-sprint39/architecture.md` 相关章节
4. 实现代码
5. `git add <new-files>`（必须，显式 add untracked 文件）
6. `git commit -m "feat(S39-P00X-EY): <描述>"`
7. `pnpm exec tsc --noEmit` 验证类型
8. 更新 dual-CHANGELOG（frontend + root）
9. `git push origin <feature-branch>`
10. 更新 task stage 到 done

**分支命名**: `epic/s39-p<NNN>-<short-name>`（如 `epic/s39-p001-i18n-ai-page`）

**Commit 格式**: `feat(S39-P001-E1): i18n AI page migration`

**代码目录**: `/root/.openclaw/vibex/vibex-fronted`

---

### tester

**职责**: 对每个 Epic 的 dev 产出进行测试验证。

**工作流程**:
1. 确认 upstream dev commit 存在且类型检查通过
2. 运行 Epic 相关 vitest 测试
3. 运行 E2E 测试（如适用）
4. 如发现测试缺失：补充测试文件
5. `git add <test-files>` → `git commit -m "test(S39-P00X-EY): <描述>"`
6. `git push origin <feature-branch>`
7. 更新 task stage 到 done

**测试命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm exec vitest run src/hooks/__tests__/<hook>.test.ts
pnpm exec vitest run src/components/<Component>/__tests__/<Component>.test.tsx
pnpm exec playwright test tests/e2e/<spec>.spec.ts
```

---

### reviewer

**职责**: 代码审查 + 验收确认。

**工作流程**:
1. 读取 dev + tester 的 git commit
2. 逐项检查 DoD checklist（见 IMPLEMENTATION_PARTITION.md）
3. 确认 dual-CHANGELOG 已更新
4. 确认 `pnpm exec tsc --noEmit` 通过
5. 如有问题：在 PR/issue 中指出；如无问题：更新 task stage 到 done
6. 发送审查结果通知

**审查清单**（每个 Epic）:
- [ ] 代码符合 architecture.md 决策
- [ ] 无内联 `style={{}}`（使用 CSS Modules）
- [ ] TypeScript 编译通过
- [ ] dual-CHANGELOG 已更新
- [ ] Epic 标识 commit message

---

## Epic 详细清单

| Epic | 内容 | Dev 预估 | 关键实现点 |
|------|------|---------|-----------|
| P001-E1 | i18n AI 页面迁移 | 2h | 新建 `src/app/ai/page.tsx`，`ai.*` i18n namespace |
| P002-E1 | WebSocket 连接层 | 3h | `useCollaboration` hook，`broadcast()` bridge |
| P002-E2 | OT 冲突检测 | 2h | 1s 窗口冲突检测，Toast + 边框样式 |
| P002-E3 | 在线用户 UI | 1h | DDSToolbar 头像堆叠 |
| P003-E1 | DiffOverlay 多文件 tab | 1.5h | Token 估算，多文件 tab 切换 |
| P003-E2 | 评分卡复杂度 | 1h | Halstead 复杂度，评分公式 |
| P004-E1 | MiniMap 搜索 + 视口边框 | 2h | `@xyflow/react` 内置 MiniMap，`ViewportPortal` |
| P005-E1 | SW 注册 | 2h | layout.tsx 注册现有 sw.js |
| P005-E2 | 语言包 + API 降级 | 1h | sw.js precache，语言包缓存 |
| P005-E3 | manifest + Lighthouse | 1h | manifest.json 已完成，验证 PWA 评分 |

---

## 技术栈提醒

- **@xyflow/react ^12.10.1** — `MiniMap`, `Controls`, `Background`, `Panel`, `ViewportPortal` 均为内置导出，无需额外 npm 包
- **sw.js** — 已有（E05 产物），只需注册，无需重写
- **manifest.json** — 已有完整 PWA 字段（icons、name、display），E3 无需重写
- **Zustand** — 状态管理库，用于 canvasStore、businessFlowStore、confirmationStore、uiStore
- **CSS Modules** — 所有样式必须使用 `.module.css`，禁止内联 `style={{}}`
- **Commit message 格式**: `feat(S39-P001-E1): i18n AI page migration`（前缀标识 Epic）

---

## 已知约束

1. **禁止 `git commit -a` 跳过 untracked 文件**：新增文件必须先 `git add <path>` 再 commit
2. **双 CHANGELOG**：每个 Epic 必须更新 `vibex-fronted/CHANGELOG.md` 和 `/root/.openclaw/vibex/CHANGELOG.md`
3. **Sprint 39 分支约定**：所有 dev push 到 `origin/epic/s39-*` 分支，不要直接 push 到 main
4. **MiniMap 验证**：`grep "MiniMap" vibex-fronted/src/components/DDSCanvas/DDSFlow.tsx`（当前不存在，需实现）
