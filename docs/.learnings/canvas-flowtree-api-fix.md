# Learnings: canvas-flowtree-api-fix

## 项目结果

| Epic | 描述 | 状态 | 验证 |
|------|------|------|------|
| E1 | mock → canvasApi.generateFlows | ✅ | changelog ✅ |
| E2 | flowId linking（子节点 flowId 正确关联） | ✅ | changelog `05ec9316` ✅ |
| E3 | error handling（错误边界完善） | ✅ | changelog `555e7c4c` ✅ |

- 所有 dev commits 已推送到 origin/main
- 虚假完成检测：16/17 ✅（coord-completed pending）

## 经验

### 1. canvas flowtree mock → real API 迁移模式

**问题**: 前端代码中 flowtree 节点数据来自 mock，直接替换为 `canvasApi.generateFlows` 需要处理接口契约差异。

**解决方案**:
- E1: 替换 mock 数据源为 `canvasApi.generateFlows`
- E2: 修复 flowId linking（子节点的 parentFlowId / rootFlowId 关联）
- E3: 添加错误处理（API 调用失败时的降级）

**防范机制**: API 迁移类变更需要 3 层验证：
1. ✅ 接口契约一致（flowId 字段存在）
2. ✅ 链路完整性（parent-child 关系正确）
3. ✅ 错误边界（网络异常/后端异常的处理）

### 2. Changelog 验证的必要性

**问题**: E2/E3 的 changelog commit hash 需要与实际 dev commit 对应。

**验证点**:
- dev commit hash 在 origin/main 中存在
- changelog commit hash 在 origin/main 中存在
- 两者都是真实 git commit，不是描述性文本

**虚假完成场景**: changelog 写的是 commit message（如 "changelog ✅"）而非真实 hash，且远程未推送。

**防范机制**: `_false_completion.py` 检查 `output` 字段是否为真实文件路径，区分描述性文本和真实 commit hash。

### 3. 虚假完成检测框架的价值

**检测规则**:
- `output` 包含 `{` `}` 未替换占位符 → 跳过
- `output` 无 `/` 和 `.`（纯中文描述）→ 跳过
- `output` 有 `/` 但无扩展名且中文比例 >50% → 跳过
- `output` 包含 `\n` 或长度 >512 → 跳过

**真实 vs 虚假**:
- 虚假：changelog "✅" / dev commit "✅" / "已完成推送" 等描述文本
- 真实：commit hash（如 `533a6904`）/ 文件路径（如 `CHANGELOG.md`）

### 4. Epic 粒度与 commit 结构

**经验**: API 迁移类变更天然适合按 Epic 拆分，因为每个 Epic 对应一个独立的修复维度：
- E1: 数据源替换（mock → real API）
- E2: 数据完整性（flowId linking）
- E3: 健壮性（error handling）

**每 Epic 一 commit** 的模式让 changelog 验证更简单（1:1 映射）。

## 时间线

- Phase1: 2026-04-05
- Coord 收口: 2026-04-05 23:55
