# Tester 提案 — Vibex 项目改进建议
**日期**: 2026-03-23
**Agent**: tester

---

## 1. 核心功能进展

### vibex-reactflow-visualization (Epic1-6)
- ✅ 所有 5 个 Epic 测试通过
- ✅ 47+ 组件单元测试通过
- ✅ TypeScript 0 errors

### vibex-homepage-api-alignment (Epic1-5)
- ✅ Epic1 数据层: 16 tests (CardTreeNode + useProjectTree)
- ✅ Epic3 首页集成: 30 tests (CardTreeView + FeatureFlag + Skeleton)
- ✅ Epic4 错误处理: 8 tests (CardTreeError)
- ✅ Epic5 性能优化: 24 unit tests, lazy loading verified
- ⚠️ 测试框架 OOM 问题: Jest worker 内存不足导致 2 个测试套件崩溃

### vibex-e2e-failures
- ⚠️ page.test.tsx 4 个失败: simplified-flow 5-step→3-step 改动未同步更新测试
- ✅ /confirm 页面存在, middleware 已删除

---

## 2. 发现的问题或风险

### P1: Jest OOM 导致测试套件崩溃
- **影响**: `useJsonTreeVisualization.test.ts` 和 `JsonTreeRenderer.test.tsx` 无法完成测试
- **根因**: Jest worker 内存不足，非代码问题
- **风险**: 测试覆盖不完整，可能遗漏 bug

### P1: page.test.tsx 预存失败 (4 tests)
- **影响**: npm test 通过率 2099/2104 (99.8%)
- **根因**: vibex-simplified-flow 将 5 步改为 3 步，但测试未更新
- **风险**: 测试失去对首页布局的验证能力

### P2: task_manager.py SyntaxWarning
- **位置**: `/root/.openclaw/skills/team-tasks/scripts/task_manager.py:633`
- **问题**: `invalid escape sequence '\['`
- **影响**: 日志可读性下降，potential future bug

---

## 3. 建议的改进方向

### 1. 修复 page.test.tsx 布局测试 (P1)
- 更新 `page.test.tsx` 中的测试用例以匹配 3-step 流程
- 将 "should have five process steps" 改为 "should have three process steps"
- 更新 layout 相关断言

### 2. 优化 Jest 测试环境内存 (P1)
- 增加 Jest `--maxWorkers` 限制
- 或配置 `--runInBand` 用于 CI 环境
- 或增加 Node 内存限制 `NODE_OPTIONS="--max-old-space-size=4096"`

### 3. 修复 task_manager.py 语法警告 (P2)
- 将正则字符串 `r"..."` 或转义 `\\[` 替代 `[`
- 示例: `""",` 前添加 `r` 前缀

### 4. 规范化 Epic 命名一致性 (P2)
- 发现 dev-epic4 输出的是 Epic3 Sprint6 工作内容
- Epic4 实际内容与任务名不符
- 建议: Epic 任务名与实际实现内容对齐

---

**提案状态**: 待评审
**提交时间**: 2026-03-23 22:45
