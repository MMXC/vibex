# 开发约束 (AGENTS.md): Proposals Review — 2026-03-30

> **项目**: proposals-20260330
> **阶段**: Phase1 执行
> **版本**: 1.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行角色

| Epic | 负责人 | 协作 |
|------|--------|------|
| Epic1 | dev | architect（架构咨询） |
| Epic2 | analyst | pm（需求确认） |
| Epic3 | tester | dev（代码支持） |
| Epic4 | pm | architect（模板咨询） |
| Epic5 | pm/architect | 所有 agent |
| Epic6 | business | pm（市场输入） |

---

## 2. 文件操作约束

### 2.1 允许修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/canvas/*.tsx` | 修改 | Epic1 checkbox 修复 |
| `src/lib/canvas/canvasStore.ts` | 修改 | 添加 toggle 函数 |
| `tests/e2e/canvas-expand.spec.ts` | 新建 | Epic3 测试 |
| `docs/competitor-matrix/` | 新建 | Epic2 竞品矩阵 |
| `docs/user-journey/` | 新建 | Epic4 旅程图 |
| `docs/templates/prd-template.md` | 新建 | Epic5 PRD 模板 |

### 2.2 禁止操作

| 操作 | 原因 |
|------|------|
| ❌ 修改现有功能 | 避免引入新 bug |
| ❌ 删除测试文件 | 保持覆盖率 |
| ❌ 修改架构文档 | 保持一致性 |

---

## 3. 代码规范

### 3.1 Checkbox 组件规范

```typescript
// ✅ 正确：toggle 函数
const toggleConfirm = (nodeId: string) => {
  set((state) => ({
    contextNodes: state.contextNodes.map(n =>
      n.nodeId === nodeId 
        ? { ...n, confirmed: !n.confirmed }
        : n
    )
  }));
};

// ❌ 错误：直接赋值
node.confirmed = true; // 违反不可变性
```

### 3.2 测试命名

```typescript
// ✅ 正确：描述性名称
it('checkbox should toggle confirmation state');

// ❌ 错误：模糊命名
it('checkbox test 1');
```

---

## 4. 测试要求

### 4.1 覆盖率门禁

```bash
# Epic3 必须通过
npm test -- --coverage --grep "canvas-expand"
# 覆盖率要求: ≥ 80%
```

### 4.2 E2E 检查清单

```bash
# Epic1 验收
npm run e2e -- --grep "checkbox"
# 必须: 可勾、可取消、状态同步
```

---

## 5. 提交流程

```
1. dev 完成 Epic1 代码
2. tester 完成 Epic3 测试
3. analyst 完成 Epic2 竞品矩阵
4. pm 完成 Epic4 + Epic5
5. business 完成 Epic6
6. 汇总报告到 proposals-20260330/tracking/
```

---

## 6. 回滚计划

| 场景 | 应对 |
|------|------|
| checkbox 引入新 bug | revert commit，恢复原逻辑 |
| 测试覆盖率下降 | 补充测试用例 |
| Epic 延期 | 重新评估优先级 |

---

## 7. 相关文档

| 文档 | 路径 |
|------|------|
| PRD | `docs/proposals-20260330/prd.md` |
| 架构 | `docs/proposals-20260330/architecture.md` |
| 提案汇总 | `proposals/20260330/` |

---

*本文档由 Architect Agent 生成，用于约束各 agent 的执行行为。*
