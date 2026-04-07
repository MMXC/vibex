# PRD: Sprint 2 — VibeX 质量提升与功能扩展

> @owner: Frontend Team  
> @updated: 2026-04-01  
> @sprint: 2026-04-02 ~ 2026-04-03

---

## 执行摘要

### 背景
Sprint 1 完成了 VibeX 核心功能的初步实现，包括画布交互、代码导出、快捷键支持等。Sprint 2 将在此基础上提升代码质量、扩展导出格式、并优化用户体验。

### 目标
1. 修复 Sprint 1 遗留的技术债（E2E 不稳定、Canvas 边界情况）
2. 扩展导出格式支持（更多框架、图片格式）
3. 优化用户体验（响应式布局、快捷键全覆盖）

### 成功指标
- E2E 测试稳定性 ≥ 95%（无偶发失败）
- 导出格式覆盖率达到 100%（React/Vue/Svelte/PNG/SVG/ZIP）
- 用户手册完整度 100%（覆盖所有核心功能）
- 技术债清理完成率 ≥ 80%

---

## Epic 总览

| Epic | 名称 | 工时 | 优先级 | 功能点数 |
|------|------|------|--------|----------|
| E1 | E2E 测试稳定性提升 | 4h | P0 | 3 |
| E2 | 导出格式扩展 | 3h | P1 | 2 |
| E3 | 技术债清理 | 3h | P1 | 3 |

---

## Epic 1: E2E 测试稳定性提升 — 4h — P0

### 功能点表

| ID | 功能点 | 验收标准 |
|----|--------|----------|
| F1 | 动态等待替代 waitForTimeout | `waitForSelector` 替换所有 `waitForTimeout` |
| F2 | 添加 force:true 处理拦截 | 棘手的点击场景使用 `force: true` |
| F3 | CI 环境超时配置 | Playwright config 增加 `timeout: 30000` |

### 详细说明
Sprint 1 的 E2E 测试在本地通过但在 CI 环境偶发超时。原因是使用了硬编码的 `waitForTimeout`，在 CI 负载较高时不够稳健。本 Epic 将全面重构测试等待策略。

---

## Epic 2: 导出格式扩展 — 3h — P1

### 功能点表

| ID | 功能点 | 验收标准 |
|----|--------|----------|
| F1 | React Native 导出 | `exportFormats` 包含 `react-native` 选项 |
| F2 | WebP 图片格式支持 | 支持 WebP 无损压缩导出 |

### 详细说明
当前导出面板已支持 React/Vue/Svelte/PNG/SVG/ZIP。Sprint 2 将扩展 React Native 导出和 WebP 格式，满足更多用户场景。

---

## Epic 3: 技术债清理 — 3h — P1

### 功能点表

| ID | 功能点 | 验收标准 |
|----|--------|----------|
| F1 | MSW Mock 稳定性修复 | MSW 服务 worker 稳定加载，无 404 |
| F2 | Canvas rAF cleanup 验证 | 所有 `requestAnimationFrame` 都有 `cancelAnimationFrame` |
| F3 | TypeScript 严格模式 | `tsc --noEmit` 错误数 ≤ 5 |

### 详细说明
根据 Sprint 1 复盘会议，识别出三类主要技术债：
1. **MSW Mock**: 测试环境 API 模拟不稳定
2. **Canvas rAF**: 动画帧未正确清理可能导致内存泄漏
3. **TypeScript**: 部分文件存在类型错误需要修复

---

## 验收标准汇总

| Epic | 验收条件 |
|------|----------|
| E1 | `grep "waitForTimeout" tests/e2e/*.spec.ts` 返回 0 结果 |
| E1 | `npx playwright test --project=chromium` 稳定通过 5 次 |
| E2 | `exportFormats.some(f => f.id === 'react-native')` 返回 true |
| E2 | `exportFormats.some(f => f.id === 'webp')` 返回 true |
| E3 | `grep -c "cancelAnimationFrame" src/**/*.tsx` ≥ 3 |
| E3 | `npx tsc --noEmit 2>&1 \| grep "error TS" \| wc -l` ≤ 5 |

---

## DoD (Definition of Done)

一个功能点被认为完成当且仅当：
1. 代码已提交并推送到 main 分支
2. 对应的 E2E 测试已创建并通过
3. `npx tsc --noEmit` 无新增错误
4. `npx eslint src/ --max-warnings=0` 通过
5. 相关文档已更新
6. Reviewer 审核通过

---

## 工时估算

| Epic | 估算工时 | 实际工时 | 偏差 |
|------|----------|----------|------|
| E1 | 4h | TBD | — |
| E2 | 3h | TBD | — |
| E3 | 3h | TBD | — |
| **合计** | **10h** | — | — |

---

## 风险与依赖

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| E2E 重构后仍有偶发失败 | P0 | 增加重试机制和更宽松的超时 |
| TypeScript 错误修复引入回归 | P1 | 全面回归测试覆盖 |
| React Native 导出复杂度超预期 | P2 | 降低优先级，先做 WebP |

---

*文档版本: v1.0 | 创建日期: 2026-04-01*
