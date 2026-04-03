# PRD: proposals-20260401-8 — Sprint 2 启动

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

Sprint 1 完成 26 Epic ✅。Sprint 2 启动聚焦：E2E 测试稳定性提升（CI 稳定性影响所有功能）、导出格式扩展（React Native + WebP）、技术债清理（canvasApi + MSW）。

### 目标

Sprint 2 第一个 Epic 交付。总工时 ~10h。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| E2E 稳定性 | 连续 3 次运行一致 | CI 重复运行 |
| React Native 导出 | 可导出 | E2E 验证 |
| canvasApi 错误 | throw Error | 单元测试 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 工时 | 优先级 | 产出文件 |
|------|------|------|--------|----------|
| E1 | E2E 测试稳定性提升 | 4h | P0 | specs/e1-e2e-stability.md |
| E2 | 导出格式扩展 | 3h | P1 | specs/e2-export-format.md |
| E3 | 技术债清理 | 3h | P1 | specs/e3-tech-debt.md |

**总工时**: 10h

---

### Epic 1: E2E 测试稳定性提升

**工时**: 4h | **优先级**: P0 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | waitForSelector 替换 | 所有 `waitForTimeout` 替换为 `waitForSelector` | `expect(waitForTimeoutCount).toBe(0)` | ❌ |
| F1.2 | force:true 处理 | 拦截元素添加 `force: true` | `expect(hasForceOption).toBe(true)` | ❌ |
| F1.3 | CI 超时配置 | Playwright config 增加 `timeout: 30000` | `expect(ciTimeout).toBeGreaterThanOrEqual(30000))` | ❌ |
| F1.4 | 稳定性验证 | E2E 测试连续 3 次运行一致 | `expect(flakyCount).toBe(0)` | ❌ |

#### DoD

- [ ] 所有 `waitForTimeout` 替换完成
- [ ] Playwright config timeout ≥ 30000
- [ ] E2E 测试连续 3 次无 flaky

---

### Epic 2: 导出格式扩展

**工时**: 3h | **优先级**: P1 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | React Native 导出 | 导出面板增加 React Native 选项 | `expect(exportOptions).toContain('react-native')` | 【需页面集成】 |
| F2.2 | WebP 导出 | 支持 WebP 无损压缩图片导出 | `expect(hasWebPSupport).toBe(true)` | 【需页面集成】 |
| F2.3 | 导出验证 | React Native 代码可编译 | `expect(rnCodeCompiles).toBe(true)` | ❌ |

#### DoD

- [ ] 导出面板支持 React Native 选项
- [ ] WebP 导出功能可用
- [ ] 导出代码可编译

---

### Epic 3: 技术债清理

**工时**: 3h | **优先级**: P1 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | canvasApi 错误处理 | fallback → throw Error | `expect(throwsError).toBe(true)` | ❌ |
| F3.2 | MSW HTTP 级别 | 函数级 → HTTP 拦截级别 | `expect(mswInterceptsHttp).toBe(true)` | ❌ |
| F3.3 | Playwright install CI | `npx playwright install` 加到 CI | `expect(hasInstallStep).toBe(true)` | ❌ |

#### DoD

- [ ] canvasApi 响应校验失败时 throw Error
- [ ] MSW 拦截 HTTP 请求
- [ ] `npx playwright install` 在 CI 中执行

---

## 3. 验收标准（汇总）

| Epic | expect() 断言 |
|------|--------------|
| E1 | `expect(waitForTimeoutCount).toBe(0)` |
| E1 | `expect(ciTimeout >= 30000)` |
| E1 | `expect(flakyCount).toBe(0)` |
| E2 | `expect(exportOptions).toContain('react-native')` |
| E2 | `expect(hasWebPSupport).toBe(true)` |
| E3 | `expect(throwsError).toBe(true)` |
| E3 | `expect(mswInterceptsHttp).toBe(true)` |
| E3 | `expect(hasInstallStep).toBe(true)` |

---

## 4. DoD

### 全局 DoD

1. **代码规范**: `npm run lint` 无 error
2. **TypeScript**: `npx tsc --noEmit` 0 error
3. **测试**: 相关功能有测试覆盖
4. **审查**: PR 经过 reviewer 两阶段审查

### Epic 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | waitForTimeout 全替换；E2E 3 次无 flaky |
| E2 | React Native 可导出；WebP 可用 |
| E3 | canvasApi throw Error；MSW HTTP 拦截 |

---

## 5. 优先级矩阵

| 优先级 | Epic | 建议排期 |
|--------|------|----------|
| P0 | E1 | Sprint 2（第 1 天） |
| P1 | E2, E3 | Sprint 2（第 1-2 天，并行） |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 22:52 GMT+8*
