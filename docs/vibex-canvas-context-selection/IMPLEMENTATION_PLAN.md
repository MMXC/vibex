# 实施计划: Canvas Context Selection Bug 修复

> **项目**: vibex-canvas-context-selection  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 详细步骤

### Phase 1: E1 + E2 合并实施 (E1)

**目标文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`

**步骤 1.1** — 读取 selectedNodeIds (5min) ✅ DONE
```
1. 确认已有 import: import { useContextStore } from '@/lib/canvas/stores/contextStore'
2. 确认已有 const ctx = useContextStore()
3. 确认已有 const selectedNodeIds = ctx.selectedNodeIds
```

**步骤 1.2** — 替换 (25min) ✅ DONE
 handleContinueToComponents 逻辑 (25min)
```
1. 找到第 767-771 行: contextNodes.map() 直接映射
2. 替换为与 CanvasPage.tsx 一致的 selection-aware 逻辑:

   const selectedContextSet = new Set(selectedNodeIds.context);
   const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
   const contextsToSend = selectedContextSet.size > 0
     ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
     : activeContexts;

3. 将 mappedContexts 改为:
   const mappedContexts = contextsToSend.map((ctx) => ({ id: ctx.nodeId, ... }));
```

**步骤 1.3** — 添加空 (15min) ✅ DONE
上下文错误检查 (15min)
```
1. 在 setComponentGenerating(true) 之后添加:
   if (contextNodes.length === 0) {
     toast.showToast('请先生成上下文树', 'error');
     setComponentGenerating(false);
     return;
   }
```

**步骤 1.4** — 验证 (15min) ✅ DONE
 (15min)
```
1. vitest BusinessFlowTree.test.tsx
2. 本地测试三种场景: 选中/未选中/空
```

---

## 2. 回滚方案

| 场景 | 回滚操作 |
|------|---------|
| 修改破坏现有功能 | 恢复第 767-771 行为直接 contextNodes.map() |
| toast 不显示 | 检查 toast.showToast 是否已导入 |

---

## 3. 成功标准

- [x] vitest BusinessFlowTree.test.tsx 全部通过 — 4/4 tests pass ✅
- [x] 选中 2 个 context → API 发送 2 个 ✅
- [x] 未选中 → API 发送全部 ✅
- [x] 空 contextNodes → toast 错误 ✅

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
