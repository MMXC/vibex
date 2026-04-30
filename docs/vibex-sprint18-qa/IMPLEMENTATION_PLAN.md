# VibeX Sprint 18 QA — 实施计划

**版本**: v1.0
**日期**: 2026-04-30
**状态**: Active
**Agent**: architect

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E18-TSFIX-1 | U1 | ✅ | U1 |
| E18-TSFIX-2 | U2 | ✅| | U2 |
| E18-TSFIX-3 | U3 | ✅| | U3 |
| E18-CORE-1 | U4 | ✅| | U4 |
| E18-CORE-2 | U5 | ✅| | U5 |
| E18-CORE-3 | U6 | ✅| | U6 |
| E18-QUALITY-1 | U7 | ✅| | U7 |
| E18-QUALITY-2 | U8 | ✅| | U8 |

**总 Unit 数**: 8
**总工时**: 14h（QA 验证）
**当前进度**: 0/8

---

## E18-TSFIX-1: mcp-server TS 修复验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1 | mcp-server TS 错误验证 | ⬜ | — | TS 编译 0 errors；CHANGELOG 含 E18-TSFIX-1；git log 可追溯 |

### U1 详细说明

**文件变更**: 无（仅验证）

**验证步骤**:
1. `cd /root/.openclaw/vibex && cd packages/mcp-server && pnpm exec tsc --noEmit`
2. 检查 exitCode = 0
3. `grep "error TS" <<< stdout`，期望数量 = 0
4. `grep "E18-TSFIX-1" /root/.openclaw/vibex/CHANGELOG.md`
5. `git log --oneline | grep "TSFIX-1" | head -1`，验证 commit 存在

**验证命令脚本**:
```bash
#!/bin/bash
cd /root/.openclaw/vibex/packages/mcp-server
pnpm exec tsc --noEmit
exit_code=$?
error_count=$(pnpm exec tsc --noEmit 2>&1 | grep "error TS" | wc -l | tr -d ' ')
echo "TS errors: $error_count"
echo "exit code: $exit_code"
[ $exit_code -eq 0 ] && [ $error_count -eq 0 ] && echo "PASS" || echo "FAIL"

# Commit SHA 追溯（直接验证 SHA 存在性）
git rev-parse e65d0537c > /dev/null 2>&1 && echo "SHA e65d0537c EXISTS" || echo "SHA NOT FOUND"
```

**风险**: 无

---

## E18-TSFIX-2: vibex-fronted TS 修复验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U2 | vibex-fronted TS 错误验证 | ⬜ | — | TS 编译 0 errors；CHANGELOG 含 E18-TSFIX-2；unwrappers 测试通过 |

### U2 详细说明

**文件变更**: 无（仅验证）

**验证步骤**:
1. `cd /root/.openclaw/vibex/vibex-fronted && pnpm exec tsc --noEmit`
2. 检查 exitCode = 0
3. error count = 0
4. `pnpm exec vitest run tests/unit/unwrappers.test.ts`，exitCode = 0
5. `grep "E18-TSFIX-2" /root/.openclaw/vibex/CHANGELOG.md`

**风险**: 无

---

## E18-TSFIX-3: @vibex/types 类型基础设施验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U3 | @vibex/types guards 测试验证 | ⬜ | — | node test-guards.mjs ≥ 38 passed；vitest guards.test.ts 通过；guards ≥ 19 个；guards 导出完整 |

### U3 详细说明

**文件变更**: 无（仅验证）

**验证步骤**:
1. `cd /root/.openclaw/vibex/packages/types && node test-guards.mjs`
   - stdout contains "passed"（期望 ≥ 38 passed，实际以测试运行结果为准）
   - stdout NOT contains "failed"
2. `cd /root/.openclaw/vibex/packages/types && pnpm exec vitest run guards.test.ts`
   - exitCode = 0
3. 读取 `src/guards.ts`，统计 `export function is[A-Z]` 数量 ≥ 19
4. 检查 guards 导出完整：`isCardTreeNodeStatus`, `isBoundedContext`, `isDedupResult`

**风险**: 无

---

## E18-CORE-1: Sprint 1-17 Backlog 扫描验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U4 | Backlog 文档验证 | ⬜ | — | backlog 文档存在；含 ≥5 个功能点；每个有 RICE 评分；CHANGELOG 含 E18-CORE-1 |

### U4 详细说明

**文件变更**: 无（仅验证）

**验证步骤**:
1. `fs.existsSync('/root/.openclaw/vibex/docs/backlog-sprint17.md')` === true
2. 读取文件，统计 `##` / `###` 标题数量 ≥ 5
3. **RICE 评分验证（逐项）**：统计 RICE 表格行数 `(backlog.match(/\|.*R.*I.*C.*E.*\|/g) || []).length >= 5`，或逐项检查每个功能点标题下存在 R/I/C/E 各字段
4. `grep "E18-CORE-1" /root/.openclaw/vibex/CHANGELOG.md`

**风险**: 无

---

## E18-CORE-2: Canvas 骨架屏验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U5 | Canvas 骨架屏验证 | ⬜ | — | CanvasPageSkeleton.tsx 存在；Skeleton.tsx 存在；CanvasPage.tsx 集成骨架屏；三栏布局骨架屏；CHANGELOG 含 E18-CORE-2 |

### U5 详细说明

**文件变更**: 无（仅验证）

**源码审查验证步骤**:
1. `fs.existsSync('vibex-fronted/src/components/canvas/CanvasPageSkeleton.tsx')` === true
2. `fs.existsSync('vibex-fronted/src/components/canvas/Skeleton.tsx')` === true
3. 读取 `CanvasPage.tsx`，内容 contains "Skeleton" 或 "loading"
4. **三栏骨架屏判定规则**（必须同时满足）：
   - 文件包含 `BoundedContext` 或 `BoundedContextTree` 关键词
   - 文件包含 `Component` 或 `ComponentTree` 关键词
   - 文件包含 `BusinessFlow` 或 `BusinessFlowTree` 关键词
   - 三者缺一不可（避免单关键词误判）

**UI 可视化验证（gstack browse）**:
1. 访问 Canvas 页面（加载中状态）
2. 截图，验证显示骨架屏（三栏占位符）
3. 验证非 spinner 加载

**风险**: 中等 — 源码存在但样式可能与设计 spec 偏差（使用 gstack 截图辅助验证）

---

## E18-CORE-3: 三树面板空状态验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U6 | 三树空状态验证 | ⬜ | — | BoundedContextTree 含空状态；ComponentTree 含空状态；BusinessFlowTree 含空状态；specs/e18-core-3-tree-empty-states.md 完整 |

### U6 详细说明

**文件变更**: 无（仅验证）

**源码审查验证步骤**:
1. 读取 `BoundedContextTree.tsx`，contains "暂无" OR "EmptyState" OR "empty"
2. 读取 `ComponentTree.tsx`，contains "暂无" OR "EmptyState" OR "empty"
3. 读取 `BusinessFlowTree.tsx`，contains "暂无" OR "EmptyState" OR "empty"
4. `fs.existsSync('specs/e18-core-3-tree-empty-states.md')` === true
5. `grep "E18-CORE-3" /root/.openclaw/vibex/CHANGELOG.md`

**UI 可视化验证（gstack browse）**:
1. 进入空项目 Canvas 页面
2. 截图三树面板，验证引导文案和操作按钮存在

**风险**: 中等 — 需验证空状态组件实际渲染正确

---

## E18-QUALITY-1: 测试覆盖率提升验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U7 | 测试覆盖率验证 | ⬜ | — | vitest guards.test.ts 通过；node test-guards.mjs 通过；guard 测试用例数 ≥ 84；CHANGELOG 含 E18-QUALITY-1 |

### U7 详细说明

**文件变更**: 无（仅验证）

**验证步骤**:
1. `pnpm exec vitest run guards.test.ts`，exitCode = 0
2. `node test-guards.mjs`，stdout contains "passed"，NOT contains "failed"
3. **guard 测试用例数验证**：stdout 匹配 `≥ 84 passed`（PRD E18-QUALITY-1 定义），使用正则 `\d+ passed` 并取最大值，断言 `>= 84`
4. `grep "E18-QUALITY-1" /root/.openclaw/vibex/CHANGELOG.md`

**风险**: 无

---

## E18-QUALITY-2: DX 改进验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U8 | DX 改进验证 | ⬜ | — | tsconfig strict === true；types/README.md 存在；migration guide 存在；CHANGELOG 含 E18-QUALITY-2 |

### U8 详细说明

**文件变更**: 无（仅验证）

**验证步骤**:
1. 读取 `vibex-fronted/tsconfig.json`，`compilerOptions.strict === true`
2. `fs.existsSync('vibex-fronted/docs/types/README.md')` === true
3. `fs.existsSync('vibex-fronted/docs/migrations/e18-tsfix.md')` === true
4. `grep "E18-QUALITY-2" /root/.openclaw/vibex/CHANGELOG.md`

**风险**: 无

---

## 验证执行顺序

### Phase 1: 命令行验证（可并行）

```
U1 (mcp-server tsc)  ═══ U2 (frontend tsc)  ═══ U3 (types guard tests)
U4 (backlog docs)    ═══ U7 (test coverage)  ═══ U8 (DX docs)
```

### Phase 2: 文件存在性验证（同步）

```
U5 (canvas skeleton)  →  源码审查 + UI 截图
U6 (tree empty state) →  源码审查 + UI 截图
```

---

## 技术约定

- 所有验证命令从 `/root/.openclaw/vibex` 根目录执行
- monorepo 使用 pnpm workspace
- TS 类型检查使用 `pnpm exec tsc --noEmit`（不执行完整编译）
- UI 验证强制使用 gstack browse，不使用 mcp__claude-in-chrome__* 工具
- exitCode 0 = 通过，非 0 = 失败
- stdout 解析使用 grep + wc -l 统计 error TS 数量
