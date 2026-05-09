# P002: 性能基线文档

**Epic**: P002-性能基线 | **U3-P002** | **日期**: 2026-05-10

---

## 当前基线值

> 记录建立时的基线值，用于回归检测。PR 触发 CI 时与基线对比。

### Bundle Size（主包）

| 指标 | 基线值 | 测量方式 |
|------|--------|----------|
| 主页面 JS bundle | 待首次 PR 触发后填充 | `ANALYZE=true pnpm build` → `.next/analyze/bundle.html` |
| 主页面 CSS bundle | 待首次 PR 触发后填充 | 同上 |
| 总包大小（未压缩） | 待首次 PR 触发后填充 | 同上 |

### Lighthouse Performance（桌面）

| 指标 | 基线值 | 测量方式 |
|------|--------|----------|
| Performance Score | ≥ 0.80 | Lighthouse CI (`lighthouserc.js`) |
| LCP (Largest Contentful Paint) | < 2500ms | Lighthouse CI |
| FCP (First Contentful Paint) | < 2000ms | Lighthouse CI |
| TBT (Total Blocking Time) | < 200ms | Lighthouse CI |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse CI |
| Speed Index | < 3000ms | Lighthouse CI |
| Accessibility Score | ≥ 0.90 | Lighthouse CI |
| Best Practices Score | ≥ 0.90 | Lighthouse CI |

---

## CI 配置

### Bundle Report（`.github/workflows/bundle-report.yml`）

- **触发**: PR 到 `main`
- **构建**: `ANALYZE=true pnpm build`
- **Artifact**: `.next/analyze/`（保留 7 天）
- **PR 评论**: 主包大小（KB）+ 变化趋势

### Lighthouse CI（`lighthouserc.js`）

- **触发**: 可独立运行（未绑定到 PR）
- **断言级别**: `warn`（不阻断 PR）
- **采样**: 3 次取中位数
- **目标 URL**: `http://localhost:3000`, `http://localhost:3000/canvas`

---

## 更新历史

| 日期 | 变更 |
|------|------|
| 2026-05-10 | 初始基线建立（待首次 CI 触发后填充实际值） |

---

## 告警阈值

| 指标 | 警告阈值 | 阻断阈值 |
|------|---------|---------|
| Performance Score | < 0.80 | — |
| LCP | > 2500ms | > 4000ms |
| TBT | > 200ms | > 500ms |
| Bundle 主包增长 | > 10% vs 基线 | > 25% vs 基线 |