# as any 基线记录

> **项目**: vibex-sprint7-fix
> **日期**: 2026-04-24
> **基线值**: 163 处

---

## 基线建立

```bash
grep -r "as any" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | wc -l
# 输出: 163
```

## 分布

| 文件 | 数量 | 根因 |
|------|------|------|
| src/hooks/useCanvasHistory.ts | 6 | Canvas history snapshot 与 store setter 类型不匹配 |
| src/components/undo-bar/UndoBar.tsx | 6 | 同上，history 相关状态赋值 |
| src/components/canvas/ProjectBar.tsx | 6 | Canvas 节点状态赋值 |
| src/hooks/ddd/useDDDStateRestore.ts | 3 | DDD 状态恢复类型不兼容 |
| src/app/preview/page.tsx | 3 | businessFlow 对象动态属性访问 |
| src/components/visualization/* | 2 | 卡片树节点类型不精确 |
| 其他文件 | 各 1 | 边界情况 |
| **合计** | **163** | |

## CI 监控规则

```yaml
# .github/workflows/ci.yml
- name: Check as any usage
  run: |
    COUNT=$(grep -r "as any" src/ --include="*.ts" --include="*.tsx" | wc -l)
    echo "as any count: $COUNT (baseline: 163)"
    if [ "$COUNT" -gt 59 ]; then
      echo "ERROR: as any usage increased from baseline 163 to $COUNT"
      exit 1
    fi
```

## DoD

- [x] 基线值记录：163 处
- [x] CI 监控已配置
- [x] 禁止新增 `as any`（CI 失败则阻断合并）
- [ ] 存量清理：分阶段修复 useCanvasHistory / UndoBar / ProjectBar 类型问题（纳入 tech debt backlog）
