# PRD: CI/CD 优化

**项目**: vibex-cicd-optimization  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: CI/CD 构建效率瓶颈，本地 35 秒，CI 因缺少缓存耗时更长。

**目标**: 构建效率提升 40%。

**预期收益**:
- npm 依赖缓存: 节省 45-60s
- .next 构建缓存: 节省 20-30s
- Playwright 浏览器缓存: 节省 15-20s

---

## 2. 功能需求

### F1: npm 依赖缓存

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | actions/cache 集成 | `expect(cache).toExist()` | P0 |
| F1.2 | node_modules 缓存 | `expect(restoreCache).toHit()` | P0 |
| F1.3 | 缓存 key 更新 | `expect(key).toUpdateOnChange()` | P0 |
| F1.4 | 缓存命中验证 | `expect(hit).toBe(true)` | P0 |

### F2: .next 构建缓存

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | .next 目录缓存 | `expect(cacheNext).toWork()` | P0 |
| F2.2 | 构建产物恢复 | `expect(restore).toSkipBuild()` | P0 |
| F2.3 | 缓存失效处理 | `expect(invalidate).toRebuild()` | P0 |

### F3: Playwright 浏览器缓存

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 浏览器缓存目录 | `expect(browserCache).toPersist()` | P0 |
| F3.2 | 缓存恢复 | `expect(restoreBrowsers).toWork()` | P0 |
| F3.3 | 安装脚本优化 | `expect(install).toUseCache()` | P0 |

### F4: 并行构建优化

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F4.1 | 任务并行 | `expect(parallel).toRun()` | P1 |
| F4.2 | 依赖任务 | `expect(needs).toConfigure()` | P1 |

---

## 3. Epic 拆分

### Epic 1: 依赖缓存

| Story | 验收 |
|-------|------|
| S1.1 npm 缓存 | `expect(cache).toHit()` |
| S1.2 验证 | `expect(install).toSkip()` |

### Epic 2: 构建缓存

| Story | 验收 |
|-------|------|
| S2.1 .next 缓存 | `expect(cacheNext).toWork()` |
| S2.2 恢复验证 | `expect(restore).toSkipBuild()` |

### Epic 3: 浏览器缓存

| Story | 验收 |
|-------|------|
| S3.1 Playwright 缓存 | `expect(browserCache).toPersist()` |

---

## 4. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | npm 缓存命中 | `expect(npmCache).toHit()` |
| AC2 | .next 缓存命中 | `expect(nextCache).toHit()` |
| AC3 | Playwright 缓存 | `expect(browserCache).toWork()` |
| AC4 | 构建时间减少 | `expect(time).toBeLessThan(baseline * 0.6)` |

---

## 5. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | npm 缓存 | 0.5d |
| 2 | 构建缓存 | 0.5d |
| 3 | 浏览器缓存 | 0.5d |
| 4 | 验证 | 0.5d |

**总计**: 2d
