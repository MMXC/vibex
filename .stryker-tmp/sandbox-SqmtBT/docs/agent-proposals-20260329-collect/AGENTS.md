# AGENTS.md — Agent 改进提案流程优化

**项目**: agent-proposals-20260329-collect
**日期**: 2026-03-29

---

## 开发约束（Dev）

### F1.3 task_manager 修复
- filelock 保留（防并发）
- 移除 @timeout 装饰器
- 使用临时文件 + rename 原子写入
- 不修改命令接口

### F2.3 confirmationStore 重构
- 使用 Zustand v4 slice pattern
- 主文件 ≤ 50 行
- 保留向后兼容 API
- 所有 actions 有 Vitest 测试

### F3.1 page.test.tsx 修复
- 不改变业务逻辑
- 聚焦修复 mock 环境问题
- 4 个测试全部 PASS 后才能提交

---

## 测试约束（Tester）

### 检查清单
- [ ] task_manager 命令全部通过（phase1, phase2, update, list, status）
- [ ] confirmationStore Vitest 100% PASS
- [ ] page.test.tsx 4/4 PASS
- [ ] dedup-verify.sh 输出 PASS
- [ ] heartbeat 无 phantom task

### 驳回红线
- 无 Vitest 测试 → 驳回
- 任何测试失败 → 驳回
- 破坏现有功能 → 驳回

---

## 审查约束（Reviewer）

### 代码审查清单
- [ ] 无硬编码密码/密钥
- [ ] 无 XSS / SQL 注入风险
- [ ] 类型安全（无 `as any`）
- [ ] changelog 更新
- [ ] 代码行数红线（confirmationStore ≤ 50 行）

### 驳回红线
- 无 changelog 更新 → 驳回
- 远程未推送 → 驳回
- 有未提交改动 → 驳回

---

## 禁止红线

1. ❌ task_manager 修改不兼容旧命令
2. ❌ confirmationStore 删除现有 API
3. ❌ 提案追踪表格式不统一
4. ❌ 绕过测试提交代码
5. ❌ 推送远程前未更新 changelog
