# BLOCKER-E5: PRDTab 无空状态组件

**严重性**: BLOCKER（阻塞）
**Epic**: E5
**Spec 引用**: specs/E5-state-handling.md, analyst-qa-report.md

## 问题描述
Spec E5-state-handling.md 要求 PRD Tab 在无数据时显示空状态引导（"还没有足够数据生成 PRD" / "请先在画布中创建内容"），但 `PRDTab.tsx` 无任何空状态处理。当 prototypeStore 和 DDSCanvasStore 均无数据时，显示的是硬编码 `PRD_SECTIONS` 内容。

## 代码证据

```bash
$ grep -n "empty\|Empty\|请先\|空状态" /root/.openclaw/vibex/vibex-fronted/src/components/delivery/PRDTab.tsx
# 无结果

# 对比 ContextTab.tsx（有空状态）
$ grep "empty\|请先" /root/.openclaw/vibex/vibex-fronted/src/components/delivery/ContextTab.tsx
110:      <div className={styles.empty}>
111:        <Package size={48} className={styles.emptyIcon} />
113:        <p className={styles.emptyHint}>请先在画布中创建上下文</p>
```

## 修复建议

在 `PRDTab.tsx` 中增加空状态判断：

```typescript
export function PRDTab() {
  const { exportItem, isExporting, exportProgress } = useDeliveryStore();
  const [showFullPRD, setShowFullPRD] = useState(false);

  // E5 空状态判断
  const prototypeData = usePrototypeStore((s) => s.getExportData());
  const ddsData = useDDSCanvasStore((s) => s.getState());
  const hasData = prototypeData.nodes.length > 0 ||
    (ddsData.chapters.api?.cards?.length ?? 0) > 0 ||
    (ddsData.chapters.context?.cards?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <div className={styles.empty}>
        <FileText size={48} className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>还没有足够数据生成 PRD</p>
        <p className={styles.emptyHint}>请先在画布中创建内容</p>
        <button className={styles.gotoBtn} onClick={() => router.push('/design/dds-canvas')}>
          去原型画布
        </button>
      </div>
    );
  }

  // 正常渲染 generatePRDMarkdown(generatePRD(...))
  // ...
}
```

## 影响范围
- `src/components/delivery/PRDTab.tsx`
- PRD Tab 无数据时的用户体验（当前显示硬编码内容）
