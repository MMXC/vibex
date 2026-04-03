# 需求分析报告: canvas-json-persistence

**任务**: Canvas JSON 前后端统一 + 版本化 + 自动保存
**分析师**: analyst
**日期**: 2026-04-02

---

## 业务场景分析

### 当前架构

```
前端 (localStorage only)
├── canvasStore.ts (1433行)
│   ├── contextNodes: BoundedContextNode[]
│   ├── flowNodes: BusinessFlowNode[]
│   └── componentNodes: ComponentNode[]
├── Zustand persist → localStorage
└── CURRENT_STORAGE_VERSION = 3

后端 (Prisma)
├── Project (version 用于乐观锁)
├── FlowData (React Flow nodes/edges)
└── 无 Canvas 节点持久化
```

### 核心痛点

| 痛点 | 现状 | 期望 |
|------|------|------|
| 数据仅存 localStorage | 换设备丢失 | 跨设备同步 |
| 无版本历史 | 无法回滚 | 可回滚到任意版本 |
| 三树字段不统一 | 独立迭代 | 统一状态机 |
| 无自动保存 | 手动刷新 | 2s debounce 自动保存 |

---

## 核心 JTBD

### JTBD 1: 用户需要跨设备工作延续
**触发**: 在公司电脑上编辑，回家后无法继续
**期望**: 打开浏览器就能看到最新状态
**对应**: A002 后端存储 + A003 自动保存

### JTBD 2: 用户需要版本回滚能力
**触发**: 误删节点或改错了想恢复
**期望**: 一键回滚到之前版本
**对应**: A002 版本化方案

### JTBD 3: 团队需要一致的数据模型
**触发**: 修改一处牵动三处，不知该改哪个
**期望**: 统一的状态定义和 Migration 策略
**对应**: A001 数据模型统一

---

## 技术方案选项

### 方案 A: 增量演进（推荐）

Phase 1: 统一数据模型
- 统一 NodeState 接口（三树共享）
- 修复 Migration 3→4（`status` 映射）
- 删除或明确 `selected` 字段

Phase 2: 后端存储
- 新建 `CanvasSnapshot` Prisma model
- 实现版本列表 API
- 实现回滚 API

Phase 3: 自动保存
- Debounce 2s + Phase 切换保存
- 版本冲突检测
- 视觉反馈

**工作量**: ~18-24h

### 方案 B: 大爆炸

一次性实现所有功能。

**工作量**: ~30-40h
**风险**: 高，周期长

---

## 可行性评估

| 提案 | 可行性 | 工时 | 风险 |
|------|--------|------|------|
| A001 数据模型统一 | ✅ 100% | 3-4h | 低 |
| A002 后端版本化 | ✅ 100% | 6-8h | 中（DB migration）|
| A003 自动保存 | ✅ 100% | 4-6h | 低 |
| A004 同步协议 | ✅ 100% | 3-4h | 低 |

---

## 验收标准

### Phase 1（数据模型）
- [ ] 三树节点类型共享统一 NodeState
- [ ] Migration 3→4 测试通过
- [ ] `npm run build` 0 error

### Phase 2（后端存储）
- [ ] `GET /api/canvas/{projectId}/snapshots` 返回版本列表
- [ ] `POST /api/canvas/{projectId}/rollback` 可回滚
- [ ] Prisma migration 成功

### Phase 3（自动保存）
- [ ] 编辑后 2s 内触发保存
- [ ] 保存状态有视觉反馈
- [ ] 页面 unload 时 beacon 保存

---

## 关键依赖

```
A001 (数据模型统一)
    ↓
A002 (后端版本化)
    ↓
A003 (自动保存) ← 需要 A002 的 API
    ↓
A004 (同步协议)
```

---

## 风险分析

| 风险 | 影响 | 缓解 |
|------|------|------|
| DB migration 影响现有数据 | 中 | staging 环境先验证 |
| 自动保存与用户编辑冲突 | 中 | 版本号比较 + 冲突提示 |
| 三树字段变更引入回归 | 中 | 每个子任务完整测试 |
