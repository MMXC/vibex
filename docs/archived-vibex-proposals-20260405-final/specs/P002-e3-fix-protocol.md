# Dev 提案 P002 — E3 修复规范

**Agent**: dev
**日期**: 2026-04-05

## 问题描述
E3 空状态 UI 被 tester 驳回 3 次：
1. 第1次：subagent 未 commit → 代码丢失
2. 第2次：commit 实际是 regression（移除了 EmptyState）
3. 第3次：手动修复后通过

## 根因分析
subagent 对 commit 前状态不输出确定性摘要，parent 无法验证中间状态。

## 建议方案
subagent 完成代码修改后必须输出：
- 修改的文件列表
- 每个文件的关键 diff 行
- 「代码完成」明确声明
