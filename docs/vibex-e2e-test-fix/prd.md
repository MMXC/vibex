# PRD: VibeX E2E Test Fix

> **项目**: vibex-e2e-test-fix  
> **目标**: 修复 E2E 测试稳定性问题  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
E2E 测试存在稳定性问题：`test.skip` 跳过测试、`@ci-blocking` 标记阻塞 CI、测试环境配置缺失。

### 目标
- P0: 移除 `test.skip`，恢复测试覆盖
- P1: 解决 `@ci-blocking` 标记
- P1: 配置测试环境变量

### 成功指标
- AC1: 所有 `test.skip` 移除，测试正常执行
- AC2: `@ci-blocking` 标记处理，不阻塞 CI
- AC3: `BASE_URL` 支持环境变量配置

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | 移除 test.skip | P0 | 0.5h |
| E2 | @ci-blocking 处理 | P1 | 0.3h |
| E3 | 测试环境配置 | P1 | 0.3h |
| **合计** | | | **1.1h** |

---

### Epic 1: 移除 test.skip

**问题根因**: `auto-save.spec.ts` 和 `onboarding.spec.ts` 使用 `test.skip` 跳过测试。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 移除 test.skip | 0.5h | 测试正常执行 ✓ |

**验收标准**:
- `expect(test.status).toBe('passed')` 或 `toBe('failed')` 非 skipped ✓

**DoD**:
- [ ] `auto-save.spec.ts` 移除 test.skip
- [ ] `onboarding.spec.ts` 移除 test.skip
- [ ] 测试正常执行（非 skipped）

---

### Epic 2: @ci-blocking 处理

**问题根因**: `vue-components.spec.ts` 使用 `@ci-blocking` 标记。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 处理 @ci-blocking | 0.3h | 不阻塞 CI ✓ |

**验收标准**:
- CI 环境不执行 `@ci-blocking` 标记的测试 ✓
- 本地环境可选择性执行 ✓

**DoD**:
- [ ] 添加 skip 逻辑处理 `@ci-blocking`
- [ ] CI 环境跳过标记测试
- [ ] 本地环境可执行

---

### Epic 3: 测试环境配置

**问题根因**: `BASE_URL` 硬编码为 `http://localhost:3002`。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------||------|------|----------|
| S3.1 | 环境变量配置 | 0.3h | 支持 BASE_URL 环境变量 ✓ |

**验收标准**:
- `expect(process.env.BASE_URL).toBeDefined()` 支持 ✓
- `process.env.CI` 时使用生产 URL ✓

**DoD**:
- [ ] `BASE_URL` 支持环境变量
- [ ] CI 环境自动配置
- [ ] 测试通过

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | test.skip 移除 | E1 | expect(status).not.toBe('skipped') | 无 |
| F2.1 | @ci-blocking 处理 | E2 | CI 环境跳过 | 无 |
| F3.1 | BASE_URL 环境变量 | E3 | expect(BASE_URL).toBeDefined() | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 运行 E2E 测试 | `npm run test:e2e` | 无 test.skip |
| AC2 | CI 环境 | 执行测试 | @ci-blocking 跳过 |
| AC3 | 本地环境 | 未设置 BASE_URL | 使用 localhost |
| AC4 | CI 环境 | 未设置 BASE_URL | 使用生产 URL |

---

## 5. DoD

### E1: 移除 test.skip
- [ ] 移除 `auto-save.spec.ts` test.skip
- [ ] 移除 `onboarding.spec.ts` test.skip
- [ ] 测试正常执行

### E2: @ci-blocking 处理
- [ ] skip 逻辑处理标记
- [ ] CI 跳过，本地可执行

### E3: 测试环境配置
- [ ] BASE_URL 支持环境变量
- [ ] CI 自动配置

---

## 6. 实施计划

| Epic | 内容 | 工时 |
|------|------|------|
| E1 | 移除 test.skip | 0.5h |
| E2 | @ci-blocking 处理 | 0.3h |
| E3 | 环境变量配置 | 0.3h |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
