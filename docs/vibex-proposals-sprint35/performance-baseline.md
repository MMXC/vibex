# VibeX Performance Baseline

**项目**: vibex-proposals-sprint35
**更新**: 2026-05-11
**状态**: 待实测（需在 main 分支运行 CI）

---

> **注意**: 本文件的实际数值需要通过以下步骤获取：
> 1. 在 `main` 分支上运行一次 Bundle Report CI
> 2. 运行 Lighthouse CI（3 runs）
> 3. 将实测结果填入下方表格
>
> 当前为空白模板，等待实测数据。

## Bundle Size

| Metric | Value | 备注 |
|--------|-------|------|
| main-bundle | `<待测量> KB` | 需在 main 分支运行 `pnpm build` with `ANALYZE=true` |

## Lighthouse Performance（Desktop）

| Metric | Baseline | Threshold（warn）| 备注 |
|--------|----------|----------------|------|
| Performance Score | `<待测量>` | minScore: 0.8 | 3 runs 中位数 |
| First Contentful Paint | `<待测量> ms` | maxNumericValue: 2000 | |
| Largest Contentful Paint | `<待测量> ms` | maxNumericValue: 2500 | |
| Total Blocking Time | `<待测量> ms` | maxNumericValue: 200 | |
| Cumulative Layout Shift | `<待测量>` | maxNumericValue: 0.1 | |
| Speed Index | `<待测量> ms` | maxNumericValue: 3000 | |

## Lighthouse Accessibility（Desktop）

| Metric | Baseline | Threshold（warn）| 备注 |
|--------|----------|----------------|------|
| Accessibility Score | `<待测量>` | minScore: 0.9 | |

## Lighthouse Best Practices（Desktop）

| Metric | Baseline | Threshold（warn）| 备注 |
|--------|----------|----------------|------|
| Best Practices Score | `<待测量>` | minScore: 0.9 | |

## 测量步骤

### 1. Bundle Size 测量

```bash
# 在 main 分支
cd vibex-fronted
ANALYZE=true pnpm build
# 解析 .next/analyze/bundle.html 中的 main bundle size
```

### 2. Lighthouse CI 测量

```bash
# 安装 lhci
npm install -g @lhci/cli@0.14

# 在项目根目录运行（需要先启动 Next.js standalone）
cd vibex-fronted
NEXT_OUTPUT_MODE=standalone pnpm start &
LHCI_SERVER_URL=http://localhost:9001 lhci autorun
```

### 3. 更新本文件

将实测结果填入上方表格，并 commit 到 main 分支。

---

*本文档由 Architect Agent 生成（S35-P002）。*
*实测后请更新本文件并移除此提示。*