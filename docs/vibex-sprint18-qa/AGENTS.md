# VibeX Sprint 18 QA — 开发约束

**版本**: v1.0
**日期**: 2026-04-30
**Agent**: architect

---

## 1. 角色与职责

| Agent | 职责 |
|-------|------|
| architect（本阶段） | 架构设计、技术审查、Unit 状态管理 |
| qa（下一阶段） | 执行 QA 验证、运行测试命令、产出验收报告 |
| coordinator | 审批架构提案、协调跨 Agent 协作 |

---

## 2. 验证执行约束

### 2.1 命令行验证

- **TS 类型检查**: 必须使用 `pnpm exec tsc --noEmit`，禁止 `tsc` 直接调用
- **Vitest 测试**: 必须使用 `pnpm exec vitest run <path>`，禁止 `npx vitest`（版本不一致风险）
- **Node Runtime**: 直接使用 `node` 命令，无需 pnpm exec
- **工作目录**: 所有命令从 `/root/.openclaw/vibex` 根目录执行，或通过 `cd <package> &&` 进入子包

### 2.2 文件路径约定

| 类型 | 路径模式 |
|------|----------|
| 前端组件 | `vibex-fronted/src/components/canvas/*.tsx` |
| 后端路由 | `packages/mcp-server/src/routes/*.ts` |
| 类型定义 | `packages/types/src/*.ts` |
| 规格文档 | `docs/vibex-sprint18-qa/specs/*.md` |
| 变更日志 | `/root/.openclaw/vibex/CHANGELOG.md`（根目录） |

### 2.3 UI 验证约定

- **浏览器验证**: 强制使用 gstack browse（`/root/.openclaw/workspace/skills/gstack-browse/bin/browse`）
- **截图输出路径**: `/root/.openclaw/vibex/test-results/sprint18-qa/`
- **禁止**: 使用 mcp__claude-in-chrome__* 工具
- **截图命名**: `<epic-id>-<component>-<state>.png`（例：`E18-CORE-2-canvas-skeleton-loading.png`）

### 2.4 状态码约定

| 状态 | 含义 |
|------|------|
| exitCode = 0 | 命令执行成功 |
| exitCode ≠ 0 | 命令执行失败 |
| TS error count = 0 | 类型检查通过 |

---

## 3. QA 验证约束

### 3.1 验证通过条件

| 验证类型 | 通过条件 |
|----------|----------|
| TS 类型检查 | exitCode = 0 AND "error TS" count = 0 |
| Vitest 测试 | exitCode = 0 |
| Node Runtime | stdout contains "passed" AND NOT contains "failed" |
| 文件存在性 | `fs.existsSync(path) === true` |
| CHANGELOG 条目 | `includes('E18-XXXX-X')` |
| UI 组件 | 文件存在 + 关键词存在 + gstack 截图验证 |

### 3.2 验证失败处理

1. 记录失败原因（stdout / exitCode）
2. 记录失败的验证命令
3. 截图记录失败状态（如 UI 验证失败）
4. 更新 Unit 状态为 ❌
5. 汇总到 QA 验证报告

### 3.3 阻塞条件

| 阻塞项 | 解决方案 |
|--------|----------|
| 上游产物缺失（无 prd.md） | 通知 coordinator，暂停 QA 阶段 |
| CHANGELOG.md 不存在 | 在根目录创建占位，或记录为失败项 |
| 源码文件不存在 | 标记为失败项，记录缺失文件列表 |

---

## 4. Git 与变更管理

### 4.1 Commit 追溯

- 每个 Epic 关联一个或多个 Commit SHA
- QA 验证必须确认 Commit SHA 在 git log 中存在
- 命令: `git log --oneline | grep "E18-XXXX-X" | head -1`

### 4.2 禁止事项

- ❌ 禁止在 QA 阶段修改源码（仅验证，不实现）
- ❌ 禁止跳过 TS 类型检查直接验证功能
- ❌ 禁止用 `tsc` 而非 `pnpm exec tsc`（版本不一致）
- ❌ 禁止跳过 CHANGELOG 条目检查（每个 Epic 必须有）

---

## 5. 报告产出约定

### 5.1 QA 验证报告结构

```
# VibeX Sprint 18 QA — 验收报告

## 执行摘要
- 总 Epic 数: 8
- 通过: X / 8
- 失败: X / 8
- 阻塞: X / 8

## 详细结果
### E18-TSFIX-1: mcp-server TS 修复
- TS 编译: ✅/❌ (X errors)
- CHANGELOG: ✅/❌
- Commit 追溯: ✅/❌

... (每个 Epic 同格式)

## 失败项汇总
| Epic | 失败原因 | 验证命令 |
|------|----------|----------|
```

### 5.2 报告输出位置

- QA 验证报告: `docs/vibex-sprint18-qa/qa-validation-report-<timestamp>.md`
- UI 截图: `test-results/sprint18-qa/`

---

## 6. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint18-qa
- **执行日期**: 2026-04-30
