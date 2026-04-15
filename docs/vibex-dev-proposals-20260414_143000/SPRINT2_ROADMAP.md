# Sprint 2 Roadmap — VibeX Dev 提案长期规划

**Project**: vibex-dev-proposals-20260414_143000  
**Epic**: E5 — 长期规划  
**Date**: 2026-04-15  
**Status**: Planned

---

## 1. Context

Sprint 1 (E1-E4) 完成以下交付：
- E1: CI TypeScript gate + Vitest baseline
- E2: Bundle audit + 3× MermaidRenderer dynamic imports
- E3: ESLint naming conventions + TODO→Issue CI
- E4: Husky console.log blocking + backend ESLint fix

**Sprint 2 聚焦**: 深化 Sprint 1 成果，补全被 defer 的高价值项。

---

## 2. Deferred Items (Sprint 1 → Sprint 2)

### 2.1 IU-7: size-limit CI (E2 Bundle 延续)
**原始状态**: 🔄 Deferred — requires @size-limit/preset-app + bundle baseline
**原因**: 需等 IU-6 (dynamic imports) 建立基线后再集成

**目标**: CI 自动检测 bundle size 增长 > 200KB 时失败

**Technical Approach**:
1. 安装: `cd vibex-fronted && npm install --save-dev @size-limit/preset-app size-limit`
2. 配置 `.size-limit.json`:
   ```json
   [
     { "path": ".next/static/chunks/pages/**/*.js", "limit": "200 KB", "gzip": true },
     { "path": ".next/static/chunks/*.js", "limit": "400 KB", "gzip": true }
   ]
   ```
3. 建基线: `npm run build && npx size-limit --json > reports/bundle-baseline.json`
4. CI 集成: `bundle-check.yml` job

**Estimated**: 2h

### 2.2 E2: Bundle Size 监控 (补全)
**原始状态**: 待处理 — 需 @next/bundle-analyzer
**原因**: IU-6 dynamic imports 已完成，监控工具未集成

**目标**: 每次 PR build 自动生成 bundle 分析报告

**Technical Approach**:
1. 安装: `cd vibex-fronted && npm install --save-dev @next/bundle-analyzer`
2. 修改 `next.config.js`:
   ```js
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true',
   });
   ```
3. 运行: `ANALYZE=true npm run build` → `.next/analyze/bundle.html`
4. CI: 上传 artifact 供 reviewer 下载

**Estimated**: 1h

### 2.3 E3: Hooks/Store 规范深化
**原始状态**: 待处理 — 需较大重构
**原因**: naming-conventions.md 已文档化，但现有代码未全量合规

**目标**: 
- 现有非规范 hooks 添加 eslint-disable 注释（grandfather）
- 新 hooks 强制规范
- Zustand stores 全部从 `index.ts` 导出

**Approach**:
```bash
# 1. 列出所有非规范 hooks
grep -rn "^export.*use" vibex-fronted/src/hooks/ --include="*.ts" --include="*.tsx" | \
  grep -v "^export const use[A-Z]" | head -30

# 2. 审计 stores/index.ts 导出完整性
# 3. 添加 eslint-disable 注释 grandfather 现有非规范 hooks
```

**Estimated**: 3h

---

## 3. New Items for Sprint 2

### 3.1 Backend TypeScript Debt Clearance
**现状**: vibex-backend 有 pre-existing TypeScript 错误（>100 个）
**目标**: `tsc --noEmit` backend → 0 errors

**Approach**: 逐文件修复，使用 `@ts-ignore` / `// @ts-nocheck` 作为最后手段
**Estimated**: 6-8h (高优先级)

### 3.2 Frontend Legacy Tests Cleanup
**现状**: 9 个 frontend test 文件有语法 bug（已在 E1 修复）
**目标**: 全部 52+ tests pass; 覆盖率 > 60%

### 3.3 E4: Backend Husky + lint-staged Full Setup
**现状**: E4 实现已交付，但 backend Husky hook 不完整（lint-staged 未配置）
**目标**: 完整 lint-staged pipeline

**Approach**:
```bash
cd vibex-backend && npm install --save-dev husky lint-staged
npx husky install
```
修改 `.husky/pre-commit`:
```bash
#!/bin/bash
npx lint-staged
```

---

## 4. Sprint 2 Execution Plan

### Week 1: Foundation
| Day | Task | Epic |
|-----|------|------|
| 1 | IU-7 size-limit CI + E2 bundle analyzer | E2 |
| 2 | Backend TS debt — routes/ core files | E1 |
| 3 | Backend TS debt — services/middleware | E1 |
| 4 | Hooks/Store audit + grandfather | E3 |

### Week 2: Polish
| Day | Task | Epic |
|-----|------|------|
| 1 | Backend Husky lint-staged full setup | E4 |
| 2 | CI pipeline 端到端验证 | E1 |
| 3 | 文档 + retrospective | all |

**Total Estimated**: 14-16h

---

## 5. Definition of Done (Sprint 2)

- [ ] `npm run size` exits 0 against baseline
- [ ] `ANALYZE=true npm run build` 生成 bundle 分析
- [ ] `cd vibex-backend && tsc --noEmit` → 0 errors (or < 10 with explicit TODO)
- [ ] All Zustand stores exported from `stores/index.ts`
- [ ] Backend Husky + lint-staged pipeline working
- [ ] Sprint 2 implementation plan documented

---

*Long-term Planning | Dev Agent | 2026-04-15*
