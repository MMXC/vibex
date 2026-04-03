# PRD: VibeX Phase 1 基础设施优化

**项目代号**: vibex-phase1-infra-20260316  
**状态**: In Progress  
**创建时间**: 2026-03-16  
**PM**: Agent PM  

---

## 1. 项目概述

### 1.1 项目目标

Phase 1 基础设施优化：React Query 集成、E2E 测试修复、测试覆盖率提升、AI 自动修复设计、统一错误边界

### 1.2 Problem Statement (核心痛点)

| 编号 | 痛点描述 | 影响范围 |
|------|----------|----------|
| P1 | 缺少 React Query 集成，数据获取逻辑分散 | 前后端数据流 |
| P2 | E2E 测试失败率高，CI/CD 阻塞 | 持续集成 |
| P3 | 测试覆盖率不足，回归风险高 | 代码质量 |
| P4 | AI 修复能力缺失，问题排查效率低 | 运维效率 |
| P5 | 错误边界不统一，异常处理混乱 | 用户体验 |

### 1.3 Success Metrics (成功指标)

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| React Query 集成完成率 | 100% | 核心 API 调用已迁移 |
| E2E 测试通过率 | ≥95% | CI 报告 |
| 测试覆盖率 | ≥80% | coverage report |
| AI 修复功能可用 | 已实现 | 功能验收 |
| 错误边界统一 | 已实施 | 代码审查 |

---

## 2. Epic 拆分

### Epic 1: React Query 集成

**目标**: 将分散的数据获取逻辑统一到 React Query 管理

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Query Client 配置 | 创建全局 Query Client 配置 | expect(queryClient).toBeDefined(); expect(defaultOptions).toHaveProperty('staleTime'); | - |
| F1.2 | API Hook 封装 | 封装 useQuery/useMutation Hook | expect(useProjects).toBeDefined(); expect(useProjects()).toHaveProperty('data'); | - |
| F1.3 | 错误处理集成 | 统一错误处理和重试逻辑 | expect(errorHandler).toBeCalled(); expect(retry).toBe(3); | - |
| F1.4 | 缓存策略优化 | 实现智能缓存和预取 | expect(cacheTime).toBeGreaterThan(0); expect(prefetchQuery).toBeDefined(); | - |

### Epic 2: E2E 测试修复

**目标**: 修复失败的 E2E 测试，提升通过率到 95% 以上

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 测试环境稳定化 | 修复测试超时和 flakiness | expect(testDuration).toBeLessThan(30000); expect(flakyCount).toBe(0); | - |
| F2.2 | 登录流程测试 | 修复登录相关测试用例 | expect(loginSuccess).toBe(true); expect(redirectUrl).toContain('/console'); | 【需页面集成】 |
| F2.3 | 导航测试 | 修复菜单导航测试 | expect(navigateTo).toHaveBeenCalled(); expect(activeMenu).toBe('dashboard'); | 【需页面集成】 |
| F2.4 | CI 配置优化 | 优化 GitHub Actions 配置 | expect(ciPassRate).toBeGreaterThanOrEqual(95); | - |

### Epic 3: 测试覆盖率提升

**目标**: 提升测试覆盖率到 80% 以上

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 组件测试补全 | 补充缺失的组件测试 | expect(coverage).toBeGreaterThanOrEqual(80); expect(untestedComponents).toHaveLength(0); | - |
| F3.2 | Hook 测试 | 添加自定义 Hook 测试 | expect(renderHook).toBeDefined(); expect(result.current).toBeDefined(); | - |
| F3.3 | 工具函数测试 | 补充工具函数测试覆盖 | expect(testFile).toExist(); expect(lineCoverage).toBeGreaterThan(80); | - |
| F3.4 | 集成测试 | 添加关键路径集成测试 | expect(integrationPass).toBe(true); expect(e2eCoverage).toBeGreaterThan(70); | - |

### Epic 4: AI 自动修复设计

**目标**: 设计并实现 AI 辅助的问题自动修复功能

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 错误分析模块 | 实现错误日志智能分析 | expect(errorParser).toBeDefined(); expect(parsedError.type).toBeDefined(); | - |
| F4.2 | 修复建议生成 | 生成可执行的修复建议 | expect(suggestion).toHaveProperty('code'); expect(confidence).toBeGreaterThan(0.8); | - |
| F4.3 | 自动修复执行 | 实现安全可控的自动修复 | expect(autoFix).toBeDefined(); expect(safetyCheck).toBe(true); | - |
| F4.4 | 修复结果验证 | 验证修复后的功能正常 | expect(verification).toHaveProperty('passed'); expect(testRun).toBe(true); | - |

### Epic 5: 统一错误边界

**目标**: 建立统一的错误边界和异常处理机制

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | Error Boundary 组件 | 创建全局 Error Boundary | expect(ErrorBoundary).toBeDefined(); expect(fallback).toBeDefined(); | 【需页面集成】 |
| F5.2 | 错误上下文 | 建立全局错误状态管理 | expect(ErrorProvider).toBeDefined(); expect(useError).toBeDefined(); | - |
| F5.3 | 统一错误提示 | 实现用户友好的错误展示 | expect(toastError).toBeDefined(); expect(errorMessage).toBeVisible(); | 【需页面集成】 |
| F5.4 | 错误日志收集 | 集成错误日志上报系统 | expect(logger).toBeDefined(); expect(uploadError).toHaveBeenCalled(); | - |

---

## 3. 页面集成检查清单

### 涉及页面集成的功能

| 功能 ID | 目标页面 | 集成位置 | 用户可见效果 |
|---------|----------|----------|--------------|
| F2.2 | src/app/page.tsx | 登录组件 | 登录后跳转到控制台 |
| F2.3 | src/app/console/page.tsx | 侧边栏导航 | 点击菜单切换内容区 |
| F5.1 | src/app/\*/page.tsx | 根组件包裹 | 异常时显示错误 UI |
| F5.3 | 全局组件 | Toast/Modal | 错误信息弹窗显示 |

---

## 4. 依赖关系

| Epic | 依赖前置条件 |
|------|--------------|
| Epic 1 | 项目基础架构稳定 |
| Epic 2 | Epic 1 完成（Query 配置） |
| Epic 3 | 无 |
| Epic 4 | Epic 3 完成（测试覆盖） |
| Epic 5 | 无 |

---

## 5. 风险与约束

### 技术风险

| 风险 | 缓解措施 |
|------|----------|
| React Query 迁移破坏现有功能 | 逐步迁移，灰度发布 |
| E2E 测试不稳定 | 修复 flaky test，增加重试 |
| AI 修复安全性 | 添加人工确认环节 |

### 时间约束

- Epic 1-2: Week 1
- Epic 3-4: Week 2
- Epic 5: Week 3

---

## 6. 验收标准

### DoD (Definition of Done)

- [ ] 所有功能点验收标准通过
- [ ] 代码已合并到主分支
- [ ] 测试通过率 ≥95%
- [ ] 文档已更新

---

**文档版本**: v1.0  
**最后更新**: 2026-03-16
