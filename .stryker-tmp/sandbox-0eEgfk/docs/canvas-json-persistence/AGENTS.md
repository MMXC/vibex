# AGENTS.md: Canvas JSON 前后端统一 + 版本化 + 自动保存

**项目**: canvas-json-persistence
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### E1: 统一数据模型
- ✅ 所有节点使用统一 NodeState 接口
- ✅ Migration 3→4 必须包含 status 和 selected 映射
- ❌ 禁止硬编码节点类型

### E2: 后端存储
- ✅ Prisma CanvasSnapshot @unique([projectId, version])
- ✅ API 必须验证 version 递增
- ❌ 禁止直接操作 SQL

### E3: 自动保存
- ✅ Debounce 2s（不得修改延迟）
- ✅ Beacon 保存 beforeunload 时必须触发
- ✅ 状态指示器：保存中/已保存/保存失败
- ❌ 禁止同步 API 调用（阻塞 UI）

### E4: 同步协议
- ✅ 冲突时必须提示用户
- ❌ 禁止静默覆盖

---

## Reviewer 约束

- [ ] NodeState 接口三树统一
- [ ] Prisma migration 无错误
- [ ] API 端点测试覆盖
- [ ] Debounce 2s 生效
- [ ] Beacon 保存触发
- [ ] 冲突检测 UI
- ❌ API 测试失败
- ❌ Migration 失败

---

## Tester 约束

| Epic | 关键测试 |
|------|---------|
| E1 | NodeState 三树统一 + Migration 3→4 |
| E2 | GET/POST/rollback API |
| E3 | Debounce + Beacon + 指示器 |
| E4 | 冲突检测 + 解决流程 |
