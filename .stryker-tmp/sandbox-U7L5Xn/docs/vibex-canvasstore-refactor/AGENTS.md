# AGENTS.md: VibeX canvasStore 职责拆分重构

**项目**: vibex-canvasstore-refactor
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### 通用规则

1. **渐进迁移**
   - ✅ 每个 Phase 后立即运行现有测试套件
   - ✅ canvasStore 保持向后兼容（re-export）
   - ❌ 禁止在未验证前进入下一 Phase

2. **Store 文件规范**
   - ✅ 每个 store < 350 行
   - ✅ 使用 Zustand persist + devtools middleware
   - ❌ 禁止在 store 内直接操作 DOM
   - ❌ 禁止 store 之间循环依赖

3. **组件迁移**
   - ✅ 每次只迁移一个 store 的消费者
   - ✅ 迁移后立即验证组件渲染
   - ❌ 禁止批量迁移（难以回滚）

### Phase 1: contextStore

1. **文件创建**
   - ✅ 创建 `src/lib/canvas/stores/contextStore.ts`
   - ✅ 提取 contextNodes 相关所有状态和 actions

2. **向后兼容**
   - ✅ canvasStore re-export contextStore
   - ✅ 现有 `useCanvasStore()` 调用无需修改

3. **测试**
   - ✅ contextStore.test.ts 覆盖率 ≥ 80%
   - ✅ 17 个现有测试全部通过

### Phase 2: uiStore

1. **组件更新**
   - ✅ 每次更新 1 个组件，立即验证
   - ✅ 使用 `useUIStore` 替换 `useCanvasStore`

2. **测试**
   - ✅ uiStore.test.ts 覆盖率 ≥ 80%
   - ✅ UI 状态（面板/滚动/拖拽）正常

### Phase 3: flowStore

1. **级联更新**
   - ✅ cascadeUpdate 必须正确触发
   - ✅ 级联逻辑测试覆盖率 ≥ 80%

2. **依赖**
   - ✅ flowStore 可读取 contextStore（单向）
   - ❌ 禁止 contextStore 依赖 flowStore

### Phase 4: componentStore

1. **依赖**
   - ✅ componentStore 可读取 flowStore（单向）
   - ✅ componentStore 可读取 contextStore（单向）
   - ❌ 禁止反向依赖

### Phase 5: sessionStore + 清理

1. **stores/index.ts**
   - ✅ 统一导出 5 个 store
   - ❌ 禁止导出内部实现细节

2. **canvasStore 清理**
   - ✅ 压缩至 < 150 行
   - ❌ 禁止删除 re-export 直到 Phase 5

---

## Reviewer 约束

### 审查重点

1. **Store 行数**
   - [ ] contextStore < 180 行
   - [ ] uiStore < 280 行
   - [ ] flowStore < 350 行
   - [ ] componentStore < 180 行
   - [ ] sessionStore < 150 行
   - [ ] canvasStore < 150 行

2. **依赖方向**
   - [ ] 无循环依赖
   - [ ] 单向链：componentStore → flowStore → contextStore

3. **测试覆盖率**
   - [ ] contextStore ≥ 80%
   - [ ] uiStore ≥ 80%
   - [ ] flowStore ≥ 80%
   - [ ] componentStore ≥ 80%
   - [ ] sessionStore ≥ 70%

4. **回归**
   - [ ] 17 个现有测试全部通过
   - [ ] UI 组件渲染正常

### 驳回条件

- ❌ 任何 store 超过行数限制
- ❌ 存在循环依赖
- ❌ 测试覆盖率不达标
- ❌ 现有测试失败
- ❌ 出现 regression

---

## Tester 约束

### 单元测试

| Store | 关键测试用例 |
|--------|-------------|
| contextStore | add/edit/delete/confirm + 状态转换 |
| uiStore | panel toggle + expand mode + scroll |
| flowStore | CRUD + cascadeUpdate |
| componentStore | CRUD + toggleSelect + generate |
| sessionStore | SSE status + messages |

### 回归测试

- [ ] 17 个现有测试全部通过
- [ ] UI 面板开关正常
- [ ] 级联更新正确触发
- [ ] localStorage 持久化正常

---

## 文件变更清单

### Phase 1

| 文件 | 操作 |
|------|------|
| `src/lib/canvas/stores/contextStore.ts` | 新增 |
| `src/lib/canvas/canvasStore.ts` | 修改（添加 re-export）|
| `src/lib/canvas/stores/contextStore.test.ts` | 新增 |

### Phase 2

| 文件 | 操作 |
|------|------|
| `src/lib/canvas/stores/uiStore.ts` | 新增 |
| `src/lib/canvas/stores/uiStore.test.ts` | 新增 |
| `~20 个组件文件` | 修改（useUIStore 替换）|

### Phase 3

| 文件 | 操作 |
|------|------|
| `src/lib/canvas/stores/flowStore.ts` | 新增 |
| `src/lib/canvas/stores/flowStore.test.ts` | 新增 |

### Phase 4

| 文件 | 操作 |
|------|------|
| `src/lib/canvas/stores/componentStore.ts` | 新增 |
| `src/lib/canvas/stores/componentStore.test.ts` | 新增 |

### Phase 5

| 文件 | 操作 |
|------|------|
| `src/lib/canvas/stores/sessionStore.ts` | 新增 |
| `src/lib/canvas/stores/sessionStore.test.ts` | 新增 |
| `src/lib/canvas/stores/index.ts` | 新增 |
| `src/lib/canvas/canvasStore.ts` | 修改（压缩至 ≤150 行）|

---

## 关键依赖链

```
Phase 1 (contextStore) → Phase 2 (uiStore) → Phase 3 (flowStore) → Phase 4 (componentStore) → Phase 5 (sessionStore + cleanup)
     ↓                    ↓                    ↓                    ↓
  17 tests pass      UI works            cascade OK           no cycles        canvasStore ≤150
```
