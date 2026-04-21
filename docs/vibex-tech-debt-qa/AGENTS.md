# AGENTS.md — vibex-tech-debt-qa

**项目**: vibex-tech-debt-qa
**日期**: 2026-04-20
**角色**: Architect
**受众**: Dev Agent、Review Agent、QA Agent

---

## 开发约束

### 通用约束

- **禁止破坏现有功能**：所有修改必须通过现有测试，不修改测试文件来绕过类型问题
- **TS 错误修复原则**：修复被测组件的类型问题，不在测试文件中加 `// @ts-ignore` 绕过
- **向后兼容**：`proposal_tracker.py` 输出格式不变，只读变更
- **无新外部依赖**（E3-U3 除外：`jest-axe` 是 dev dependency，不影响生产 bundle）

### E1 — page.test.tsx 修复

- 根因诊断必须用 `pnpm exec tsc --noEmit`，不用 `npx tsc`
- 修复顺序：先修被测组件类型，再验证测试通过
- `pre-test-check.js` 修复后不修改（只改导致其失败的源文件 TS 错误）
- 不修改 `scripts/pre-test-check.js` 本身

### E2 — proposal-dedup 验证

- 测试脚本 `test_proposal_dedup.py` 只读 `proposal_tracker.py` 的输出，不修改其逻辑
- 验证用例必须覆盖：重复 proposal_id、跨日期同名 proposal、PRD 解析失败
- 生产数据上运行不产生副作用（只读）

### E3 — 组件测试补全

- Vitest（项目基准），不引入 Jest
- `jest-axe` 作为 dev dependency 安装：`pnpm add -D jest-axe`
- CardTreeNode 测试覆盖：`isExpanded` 状态、嵌套深度、`root` 类型样式差异
- API 错误测试用 `vi.fn()` mock `fetch`，不依赖真实网络

### E4 — ErrorBoundary 去重

- **保留**：`CardErrorBoundary`（语义隔离，Canvas 内部卡片级错误捕获）
- **合并**：`AppErrorBoundary`（全局唯一顶层兜底）← 合并其他 ErrorBoundary
- `VisualizationPlatform.tsx` 中的 `class ErrorBoundary` → 替换为函数组件 `<ErrorBoundary>`
- `JsonRenderErrorBoundary` → 继承或委托到 `ui/ErrorBoundary`，不单独实现
- 合并后运行 `pnpm build` 验证无回归

### E5 — HEARTBEAT 话题追踪

- `heartbeat_tracker.py` 只读 `workspace-coord/heartbeat/*.json`
- 不修改 heartbeat JSON 格式或生成逻辑
- 幽灵任务判断：连续 3 天状态不变且非 `done`
- 输出格式：Markdown 表格或 CSV

---

## 不在本期处理

- E3: 完整 a11y 覆盖（基线仅覆盖 Button/Input/Modal，后续 Epic 扩展）
- E4: React 18 ErrorBoundary 最佳实践（迁移到 `error.tsx` 文件约定）
- E2: proposal_tracker.py 去重逻辑重构（仅添加验证脚本）

---

## 执行决策

- **决策**: 待 coord-decision
- **日期**: 2026-04-20
