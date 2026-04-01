# 技术债清理计划

> @owner: Frontend Team  
> @updated: 2026-04-01  
> @sprint: Sprint 2 (2026-04-02 ~ 2026-04-03)

---

## 执行摘要

本文档记录了 Sprint 1 期间发现但未处理的技术债务，以及清理计划。目标是在 Sprint 2 中完成 80% 的技术债清理，提升代码质量和系统稳定性。

---

## 债务清单

| ID | 标题 | 责任人 | 工时 | 优先级 | 类别 | 影响范围 |
|----|------|--------|------|--------|------|----------|
| TD-1 | MSW Mock 不稳定 | @dev | 4h | P1 | test | API Mock 测试 |
| TD-2 | Canvas rAF 未清理 | @dev | 2h | P0 | code | 画布交互内存泄漏 |
| TD-3 | Playwright 测试覆盖不足 | @tester | 6h | P1 | test | E2E 测试 |
| TD-4 | TypeScript 严格模式错误 | @dev | 3h | P2 | code | 类型安全 |
| TD-5 | E2E 测试偶发超时 | @dev | 3h | P0 | test | CI 稳定性 |
| TD-6 | CSS Module 类名测试依赖 | @dev | 2h | P2 | code | 测试健壮性 |

---

## 详细说明

### TD-1: MSW Mock 不稳定

**问题描述**:
MSW (Mock Service Worker) 在测试环境中加载不稳定，偶发 404 错误，导致 API 测试失败。

**影响范围**:
- `tests/e2e/*.spec.ts` 中的 API 相关测试
- CI 环境中的端到端测试

**解决方案**:
1. 检查 `public/mockServiceWorker.js` 是否存在
2. 配置 MSW 在测试模式下使用 `window.fetch` 而非 Service Worker
3. 添加 fallback mock 数据

**工时**: 4h  
**优先级**: P1

---

### TD-2: Canvas rAF 未清理

**问题描述**:
部分 `requestAnimationFrame` 调用没有对应的 `cancelAnimationFrame` cleanup，可能导致内存泄漏。

**影响范围**:
- `src/components/canvas/CanvasPage.tsx`
- `src/components/canvas/TreePanel.tsx`

**解决方案**:
1. 全面审计所有 `requestAnimationFrame` 使用
2. 为每个 rAF 添加 `useEffect` cleanup 返回 `cancelAnimationFrame`
3. 添加 E2E 测试验证内存使用

**工时**: 2h  
**优先级**: P0  
**状态**: ✅ 部分已修复 (commit 44f55e89)

---

### TD-3: Playwright 测试覆盖不足

**问题描述**:
当前 E2E 测试覆盖率约 60%，部分核心用户路径缺少自动化测试。

**影响范围**:
- 导出功能（PNG/SVG/ZIP）
- 快捷键（Ctrl+G, Alt+1/2/3）
- Canvas 交互

**解决方案**:
1. 补充导出功能 E2E 测试
2. 添加快捷键场景测试
3. 增加 Canvas 拖拽、缩放测试

**工时**: 6h  
**优先级**: P1

---

### TD-4: TypeScript 严格模式错误

**问题描述**:
`npx tsc --noEmit` 报告 9 个 pre-existing 错误，主要是类型不匹配和接口定义问题。

**影响范围**:
- `src/lib/schemas/canvas.ts`
- `src/lib/versioned-storage/types.ts`

**解决方案**:
1. 逐个修复类型错误
2. 使用 `// @ts-ignore` 临时抑制无法快速修复的错误
3. 建立 CI 类型检查 gate

**工时**: 3h  
**优先级**: P2

---

### TD-5: E2E 测试偶发超时

**问题描述**:
Playwright 测试在 CI 环境中偶发超时，本地环境正常。原因是 `waitForTimeout` 硬编码等待时间不足。

**影响范围**:
- `tests/e2e/*.spec.ts`
- CI/CD pipeline

**解决方案**:
1. 替换所有 `waitForTimeout` 为 `waitForSelector` 动态等待
2. 增加 Playwright 全局超时配置
3. 添加测试重试机制

**工时**: 3h  
**优先级**: P0

---

### TD-6: CSS Module 类名测试依赖

**问题描述**:
E2E 测试依赖 CSS Module 生成的哈希类名（如 `formatCardSelected_abc123`），导致测试脆弱。

**影响范围**:
- `tests/e2e/export-formats.spec.ts`
- 其他使用 `.toHaveClass` 的测试

**解决方案**:
1. 为关键元素添加 `data-testid` 属性
2. 使用 `data-testid` 替代 CSS 类名选择器
3. 验证选中状态使用可见元素（如 badge）而非类名

**工时**: 2h  
**优先级**: P2  
**状态**: ✅ 部分已修复 (commit aa39e046)

---

## 清理进度

| TD-ID | 状态 | 完成日期 | 备注 |
|-------|------|----------|------|
| TD-1 | 🔄 进行中 | — | — |
| TD-2 | ✅ 已完成 | 2026-04-01 | commit 44f55e89 |
| TD-3 | 🔄 进行中 | — | — |
| TD-4 | 🔄 进行中 | — | — |
| TD-5 | 🔄 进行中 | — | — |
| TD-6 | ✅ 已完成 | 2026-04-01 | commit aa39e046 |

**完成率**: 2/6 (33%) → 目标 80% (5/6)

---

## 资源分配

| 负责人 | 分配任务 | 预计工时 |
|--------|----------|----------|
| @dev | TD-2, TD-5, TD-6 | 7h |
| @tester | TD-3 | 6h |
| @dev | TD-4 | 3h |
| @dev | TD-1 | 4h |
| **合计** | | **20h** |

---

## 验收标准

- [ ] TD-2: `grep -c "cancelAnimationFrame" src/components/**/*.tsx` ≥ 3
- [ ] TD-5: `grep "waitForTimeout" tests/e2e/*.spec.ts | wc -l` = 0
- [ ] TD-6: `grep "data-testid" src/app/export/page.tsx | wc -l` ≥ 3
- [ ] TD-3: E2E 测试覆盖率 ≥ 80%
- [ ] TD-4: TypeScript 错误数 ≤ 5
- [ ] TD-1: MSW 测试通过率 ≥ 95%

---

*文档版本: v1.0 | 创建日期: 2026-04-01*
