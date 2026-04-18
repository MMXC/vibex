# BLOCKER E3-QA2: 路由页面缺失

**严重性**: BLOCKER（功能性阻断）
**Epic**: E3
**Spec 引用**: specs/E3-version-history.md

## 问题描述
- **Spec E3**: `app/canvas/delivery/version/page.tsx` 应存在
- **实际**: 文件不存在
- **现有**: `app/version-history/page.tsx` 存在（路由不同）

## 代码证据

```bash
$ find /root/.openclaw/vibex/vibex-fronted/src -path "*/canvas/delivery/version*" -name "page.tsx"
# 无结果

$ ls /root/.openclaw/vibex/vibex-fronted/src/app/version-history/page.tsx
/root/.openclaw/vibex/vibex-fronted/src/app/version-history/page.tsx  # 存在于不同路径
```

## 路由分析

| 路由 | Spec 要求 | 实际 | 状态 |
|------|---------|------|------|
| `/canvas/delivery/version` | ✅ Spec 要求 | ❌ NOT FOUND | BLOCKER |
| `/version-history` | ❌ 非 Spec | ✅ 存在 | 可用但非 Spec |

## 修复建议

1. **对齐路由规范**: 与 analyst/PM 确认 `/version-history` vs `/canvas/delivery/version` 哪个是正确的
2. **如果 `/version-history` 正确**: 更新 Spec E3 以匹配实际实现
3. **如果 `/canvas/delivery/version` 正确**: 创建该路由页面（可复用 `/version-history` 内容）

## 影响范围
- `src/app/version-history/page.tsx`（现有路由）
- `src/components/version-diff/VersionDiff.tsx`（组件已完整）
- 用户无法通过 Spec 预期路径访问 VersionDiff
