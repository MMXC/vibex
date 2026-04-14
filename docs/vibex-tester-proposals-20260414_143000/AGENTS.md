# AGENTS.md — VibeX Tester Proposals — QA Sprint

> **项目**: vibex-tester-proposals-20260414_143000  
> **日期**: 2026-04-14

---

## 1. 开发约束

### 1.1 E1 CI 门禁

- tsconfig 修复**必须验证** `tsc --noEmit` 退出码 0
- Vitest exclude 修复后运行 `vitest run --reporter=verbose` 确认无 node_modules 误报
- 任何 CI 步骤失败必须**立即修复**，不允许跳过

### 1.2 E2 测试

- Canvas Phase 边界测试依赖 Playwright 环境（Unit 7 先完成）
- Auth 视觉测试首次运行自动生成 baseline（需设置 `UPDATE_BASELINE=true`）
- bundle size 阈值 **200KB**，超过必须报警

### 1.3 E3 Playwright

- 使用 `@playwright/test`
- `playwright.config.ts` 中固定 viewport 1920×1080
- 所有 E2E 测试 `data-testid` 属性必须与实现团队对齐

---

## 2. 测试文件结构

```
frontend/
  tests/
    e2e/
      canvas-phase.spec.ts     # E2.S2
      auth-visual.spec.ts      # E2.S1
    baseline/
      auth-login.png          # Auth 视觉 baseline
      auth-register.png
    fixtures/
      sample-canvas.json     # Canvas 导入测试数据

scripts/
  bundle-size.js             # E2.S3
```

---

## 3. CI 门控

| 检查项 | 工具 | 失败策略 |
|--------|------|---------|
| 前端类型检查 | `tsc --noEmit` | CI 红锁 |
| 后端类型检查 | `tsc --noEmit` | CI 红锁 |
| 单元测试 | `vitest run` | CI 红锁 |
| Bundle 阈值 | `size-limit` | CI 警告 |
| E2E 测试 | `playwright test` | CI 红锁 |

---

## 4. 参考文档

- PRD: `docs/vibex-tester-proposals-20260414_143000/prd.md`
- Specs: `docs/vibex-tester-proposals-20260414_143000/specs/`

---

*Architect Agent | 2026-04-14*
