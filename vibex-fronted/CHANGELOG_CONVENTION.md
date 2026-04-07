# CHANGELOG Convention

本文档定义了 VibeX Frontend 项目的变更日志格式规范。

## Epic 条目结构

每个 Epic 结束时，在 `CHANGELOG.md` 顶部追加以下格式的条目：

```markdown
## [Epic <编号>.<子编号>] <Epic 名称> (<YYYY-MM-DD>)

### 类型标签
<feat|fix|refactor|docs|test|chore>

### 变更摘要
- <变更点 1>
- <变更点 2>
- <变更点 N>

### 影响范围
- 影响的模块或组件
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| Epic 编号 | ✅ | 来自 Sprint Planning 的 Epic 编号，如 `1.1.1` |
| Epic 名称 | ✅ | 简洁的 Epic 描述 |
| 日期 | ✅ | 验收通过日期，格式 `YYYY-MM-DD` |
| 类型标签 | ✅ | 标注本次 Epic 的主要变更类型 |
| 变更摘要 | ✅ | 列出具体变更点，每行一个 |
| 影响范围 | ⚠️ | 涉及 UI/UX 变更时必须填写 |

## 类型标签说明

| 标签 | 含义 | 使用场景 |
|------|------|----------|
| `feat` | 新功能 | 新增页面、组件、功能模块 |
| `fix` | Bug 修复 | 修复已知缺陷 |
| `refactor` | 重构 | 改进代码结构但不改变功能 |
| `docs` | 文档 | 文档更新（README、CHANGELOG 除外） |
| `test` | 测试 | 新增或修改测试用例 |
| `chore` | 杂务 | 依赖更新、配置调整、CI/CD |

## 禁止事项

1. **禁止手动修改 `src/app/` 下的页面文件**
   - App 页面由 AI 根据领域模型和流程定义自动生成
   - 如需修改，应修改 `src/app/domain/`、`src/app/flow/` 等上游定义
   - 手动修改会被 Reviewer 驳回（类型 D）

2. **禁止在 CHANGELOG 中记录热修复的实验性 PR**
   - 实验性 PR 应标记 `[skip-changelog]`，不记录到 CHANGELOG

3. **禁止删除历史条目**
   - CHANGELOG 是线性追加的，不删除历史记录

## 示例

```markdown
## [Epic 1.1.1] 修复 Stream 断开重连 (2026-04-01)

### 类型标签
fix

### 变更摘要
- 修复 AI 回复中断后 Stream 不自动重连的问题
- 增加重连状态 UI 提示
- 优化 SSE 错误处理逻辑

### 影响范围
- src/components/dialogue/ChatStream.tsx
- src/hooks/useStream.ts
```

## 维护责任人

- **Dev**: Epic 结束时追加条目
- **Reviewer**: 验收时检查 CHANGELOG 是否合规
