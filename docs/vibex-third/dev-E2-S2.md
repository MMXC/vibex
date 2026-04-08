# dev-E2-S2: BusinessFlowTree 虚拟化

**项目**: vibex-third
**阶段**: dev
**日期**: 2026-04-09
**Epic**: E2 Canvas 虚拟化列表
**依赖**: E2-S1

---

## 产出

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/canvas/BusinessFlowTree.tsx` | 修改 | 虚拟化实现 |
| `docs/vibex-third/dev-E2-S2.md` | 新建 | 本文档 |

---

## 实现内容

### src/components/canvas/BusinessFlowTree.tsx

与 E2-S1 相同的虚拟化模式应用于 BusinessFlowTree：

- `VIRTUAL_THRESHOLD = 50` — 与 ComponentTree 保持一致
- `oversizedFlowList` — useMemo，检测 flowNodes 是否超过阈值
- `VirtualizedFlowList` — 独立组件，使用 `useVirtualizer` 渲染大列表
- 估算卡片高度 160px，overscan 5
- 大列表禁用 DnD 拖拽

---

## 验收

- [x] `VIRTUAL_THRESHOLD = 50` 常量存在
- [x] `oversizedFlowList` useMemo 正确检测大列表
- [x] `VirtualizedFlowList` 组件使用 `useVirtualizer`
- [x] npm run build 通过

---

## 关联

- E2-S1: ComponentTree 虚拟化
- E2-S2: BusinessFlowTree 虚拟化
- E2-S3: ContextTree 虚拟化（待实现）
