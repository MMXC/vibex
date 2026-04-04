# 实施计划: Canvas Generate Components Context Fix

> **项目**: canvas-generate-components-context-fix  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 详细步骤

### Phase 1: E1 checkbox 修复 (0.3h)

**目标文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`

**步骤 1.1** — 定位并修复 (10min) ✅ DONE
```
1. 找到第 234 行 ✅
   onChange={() => { toggleContextNode(node.nodeId); }}
2. 改为 ✅
   onChange={() => { onToggleSelect?.(node.nodeId); }}
3. 注意: 使用 ?.() optional chaining 防止 undefined ✅
```

**步骤 1.2** — 验证 (8min) ✅ DONE
```
1. vitest BoundedContextTree.test.tsx — 8/8 tests pass ✅
2. 断言: checkbox → toggleNodeSelect('context', nodeId); toggleContextNode NOT called ✅
```

---

## 2. 回滚方案

| 场景 | 回滚操作 |
|------|---------|
| 破坏 checkbox | 恢复第 234 行: `toggleContextNode(node.nodeId)` |

---

## 3. 成功标准

- [x] vitest BoundedContextTree.test.tsx 全部通过 — 8/8 pass ✅
- [x] checkbox 点击后 selectedNodeIds.context 包含 nodeId — onToggleSelect → toggleNodeSelect ✅
- [x] toggleContextNode 不被 checkbox 调用 ✅

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
