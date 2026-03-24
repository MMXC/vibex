# 实施计划 — 提案汇总项目

**项目**: vibex-proposals-summary-20260324_0958  
**作者**: Architect Agent  
**时间**: 2026-03-24 11:15 (Asia/Shanghai)

---

## Sprint 1（本週）：止血 + 高风险修复

### Task 1.1: ErrorBoundary 去重 [P0] — 0.5d

**执行步骤**:
1. 审计所有 ErrorBoundary import： `grep -r "error-boundary" src/ --include="*.tsx" -l`
2. 统一到 `components/ui/ErrorBoundary.tsx`
3. 删除 `components/error-boundary/` 目录
4. 导出到 `components/ui/index.ts`
5. 运行 `npm test` 确保无回归

**验收标准**:
- `grep "from 'error-boundary'" src/` 返回 0 结果
- `grep "from '@/components/ui/ErrorBoundary'" src/` 覆盖所有原有引用
- `npm test -- --grep ErrorBoundary` 全部通过

**负责人**: dev

---

### Task 1.2: confirmationStore 拆分 [P1] — 1.5d

**执行步骤**:
1. 创建 `stores/confirmation/steps/` 目录结构
2. 从现有 `confirmationStore.ts` 提取各 step 逻辑到独立文件
3. 使用 Zustand `combine` 或 `slice` 模式组合子状态
4. 保持主 `useConfirmationStore()` API 不变
5. 新增独立 step hooks：`useRequirementStep()`, `useContextStep()`, `useModelStep()`, `useFlowStep()`
6. 验证 localStorage 快照兼容性
7. 更新所有消费组件的 import

**验收标准**:
- `src/stores/confirmationStore.ts` 行数 ≤ 100
- `src/stores/confirmation/steps/useRequirementStep.ts` 存在且可独立使用
- `npm test -- --grep confirmation` 全部通过
- `grep "localStorage" src/stores/confirmation/` 确认快照格式兼容

**负责人**: dev + architect（架构设计审核）

---

## Sprint 2（下週）：生产验证 + 基础设施

### Task 2.1: proposal-dedup 生产验证 [P0] — 2d

**执行步骤**:
1. 在 `proposals/20260323/` 真实数据上运行 dedup 脚本
2. 验证关键词提取准确性
3. 修复边界 case（中文bigram、空格处理）
4. 集成到 task_manager.py `check-dup` 命令

**验收标准**:
- dedup 脚本在 `proposals/` 历史数据上运行无报错
- 识别的重复提案命中率 > 80%（人工验证）

**负责人**: dev + tester

---

### Task 2.2: 共享类型包初始化 [P3] — 2d

**执行步骤**:
1. 创建 `packages/types/` 目录结构
2. 定义核心类型：`api.ts`, `domain.ts`, `store.ts`
3. 配置 `tsconfig.json` 确保可被 `src/` 引用
4. 迁移现有散落类型到统一包
5. CI 添加跨包类型检查

**验收标准**:
- `packages/types/src/index.ts` 导出所有核心类型
- `tsc --project packages/types --noEmit` 无错误
- `import { Project } from '@/types'` 在 `src/` 中正常工作

**负责人**: dev + architect

---

### Task 2.3: heartbeat 幽灵任务修复 [P1] — 0.5d

**执行步骤**:
1. 修改 `coord-heartbeat-v8.sh`：读取项目前先检查目录是否存在
2. 添加空目录保护逻辑
3. 验证修复效果

**验收标准**:
- `coord-heartbeat-v8.sh` 在不存在项目目录时无误报

**负责人**: dev

---

## Sprint 3：质量与架构

### Task 3.1: React Query 覆盖率提升 [P3] — 持续

**执行步骤**:
1. 审计 `api.ts` 所有调用点
2. 识别高价值缓存场景（项目列表、配置数据）
3. 逐步迁移到 React Query（每 sprint 2-3 个）
4. 验证乐观更新与 UI 状态兼容性

**验收标准**:
- `hooks/queries/` 覆盖率从 6 → 12+
- 重复 API 请求减少 > 50%

**负责人**: dev

---

### Task 3.2: E2E 纳入 CI [P1] — 2h

**执行步骤**:
1. 在 CI 环境安装 Playwright browsers
2. 添加 `npm run test:e2e:ci` 命令（无 UI 模式）
3. GitHub Actions workflow 添加 E2E step
4. 生成 HTML 报告

**验收标准**:
- CI 日志显示 `playwright` 测试执行
- `playwright-report/` 包含测试结果

**负责人**: dev

---

## 风险缓解

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|---------|
| confirmationStore 拆分破坏现有功能 | 中 | 高 | 增量迁移，每步验证 |
| 共享类型包与后端不同步 | 高 | 中 | 短期手动同步，建立 CI 检查 |
| E2E CI 环境不支持 Chromium | 低 | 中 | Docker 容器化测试环境 |
| localStorage 快照格式不兼容 | 低 | 中 | 保持 v1 格式，新增字段可选 |

---

## 工时汇总

| Sprint | Task | 工时 | 负责 |
|--------|------|------|------|
| 1 | ErrorBoundary 去重 | 0.5d | dev |
| 1 | confirmationStore 拆分 | 1.5d | dev+architect |
| 2 | dedup 生产验证 | 2d | dev+tester |
| 2 | 共享类型包 | 2d | dev+architect |
| 2 | heartbeat 幽灵任务 | 0.5d | dev |
| 3 | React Query 覆盖率 | 持续 | dev |
| 3 | E2E 纳入 CI | 2h | dev |
| **合计** | | **~7d** | |
