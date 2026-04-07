# AGENTS.md: Checkbox 勾选状态持久化修复

**项目**: checkbox-persist-bug
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### E1: 数据结构
- ✅ 所有节点类型添加 `selected: boolean` 字段
- ✅ types.ts: BoundedContextNode / BusinessFlowNode / ComponentNode
- ❌ 禁止删除现有必需字段

### E2: 三树持久化
- ✅ toggle 时同时更新 store（Zustand persist 自动写入 localStorage）
- ✅ 加载时从 localStorage 恢复（Zustand persist 自动加载）
- ✅ 无需单独 JSON 文件写入
- ❌ 禁止只更新 store 不写 localStorage

### E3: Prompt
- ✅ 只发送 `status === 'confirmed'` 的节点
- ✅ generateComponentFromFlow 已过滤 confirmed 节点
- ❌ 禁止发送未勾选节点

### E4: 导入
- ✅ `selected` 字段随 Zustand persist 状态恢复
- ✅ localStorage 自动持久化和恢复
- ❌ 禁止丢失确认状态数据

---

## Reviewer 约束

- [x] 三树 toggle 后状态持久化到 localStorage
- [x] 刷新后勾选状态保留（Zustand persist）
- [x] Prompt 只含 confirmed 节点
- [x] 导入后状态恢复（Zustand persist）
- [x] npm test 通过
- ❌ 测试失败
