# Phase 1 基础设施优化需求分析

**项目**: vibex-phase1-infra-20260317  
**分析师**: Analyst Agent  
**日期**: 2026-03-17  
**状态**: ✅ 分析完成

---

## 执行摘要

**目标**: 完成 Phase 1 基础设施优化，包含 React Query 全面集成、E2E 测试环境修复、测试覆盖率提升至 65%。

**当前状态**:
| 指标 | 当前值 | 目标值 | 差距 |
|------|--------|--------|------|
| 测试覆盖率 | 61.45% | 65% | +3.55% |
| E2E 通过率 | 未知 | 90% | 需验证 |
| React Query 集成 | 部分 | 全面 | 需完善 |

**总工作量**: 约 5-6 人日

---

## 一、现状分析

### 1.1 React Query 集成状态

**已安装依赖**:
```json
"@tanstack/react-query": "^5.90.21",
"@tanstack/react-query-persist-client": "^5.90.24"
```

**已有文件**:
| 文件 | 覆盖率 | 状态 |
|------|--------|------|
| `lib/query/QueryProvider.tsx` | 55.17% | 需完善测试 |
| `lib/query/persistQueryClient.ts` | 95.65% | ✅ 正常 |
| `hooks/queries/useDDD.ts` | 100% | ✅ 正常 |
| `hooks/queries/useEntities.ts` | 100% | ✅ 正常 |
| `hooks/queries/useFlows.ts` | 100% | ✅ 正常 |
| `hooks/queries/useProjects.ts` | 100% | ✅ 正常 |
| `hooks/queries/useRequirements.ts` | 100% | ✅ 正常 |

**问题识别**:
1. `QueryProvider.tsx` 覆盖率仅 55.17%，缺少边界条件测试
2. 部分组件仍在使用原生 fetch 而非 React Query hooks
3. 缓存策略未统一配置

### 1.2 E2E 测试环境状态

**测试文件清单**:
```
tests/e2e/auth-flow.spec.ts
tests/e2e/project-flow.spec.ts
tests/e2e/visual-regression.spec.ts
tests/e2e/user-flows/requirement-input.spec.ts
tests/e2e/homepage-ui-fix.spec.ts
tests/e2e/react-query.spec.ts
tests/e2e/confirmation-progress-persist.spec.ts
...
```

**潜在问题**:
| 问题 | 可能性 | 说明 |
|------|--------|------|
| Playwright 配置错误 | 🟡 中 | testDir 配置可能限制了某些测试 |
| 测试环境依赖 | 🟡 中 | 需要后端服务运行 |
| 浏览器安装 | 🟢 低 | CI/CD 环境可能缺少浏览器 |

**需要验证**:
```bash
# 检查 Playwright 配置
cat playwright.config.ts

# 运行 E2E 测试
npx playwright test --reporter=list
```

### 1.3 测试覆盖率分析

**当前覆盖率**:
| 指标 | 当前 | 目标 | 差距 |
|------|------|------|------|
| Lines | 61.45% | 65% | +3.55% |
| Statements | 60.32% | 65% | +4.68% |
| Functions | 60.11% | 65% | +4.89% |
| Branches | 51.25% | 60% | +8.75% |

**低覆盖率文件** (优先提升):
| 文件 | Lines 覆盖率 | 优先级 |
|------|--------------|--------|
| `components/homepage/hooks/useHomeGeneration.ts` | 1.66% | P0 |
| `components/homepage/hooks/useHomePageState.ts` | 8.33% | P0 |
| `components/homepage/hooks/useHomePanel.ts` | 7.5% | P0 |
| `components/ui/ThinkingPanel.tsx` | 3.12% | P0 |
| `components/homepage/AIPanel/AIPanel.tsx` | 9.09% | P1 |
| `components/ui/AIChatPanel.tsx` | 0% | P1 |
| `lib/api-config.ts` | 20% | P1 |

---

## 二、技术方案

### 2.1 React Query 全面集成

**目标**: 将所有 API 调用迁移到 React Query hooks

**迁移清单**:
| 组件 | 当前方式 | 目标方式 | 工作量 |
|------|----------|----------|--------|
| `useDDDStream.ts` | 原生 fetch | React Query mutation | 0.5 天 |
| `useApiCall.ts` | 自定义 hook | React Query hooks | 0.5 天 |
| `services/api/client.ts` | 封装 fetch | React Query client | 0.5 天 |

**统一缓存配置**:
```typescript
// lib/query/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 分钟
      gcTime: 30 * 60 * 1000,    // 30 分钟
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 2.2 E2E 测试环境修复

**修复步骤**:
1. 检查 `playwright.config.ts` 配置
2. 确保测试环境依赖（后端服务、浏览器）
3. 运行并修复失败的测试
4. 配置 CI/CD 环境

**配置验证**:
```bash
# 1. 检查配置
npx playwright --version
cat playwright.config.ts

# 2. 安装浏览器
npx playwright install

# 3. 运行测试
npx playwright test --reporter=list

# 4. 生成报告
npx playwright show-report
```

### 2.3 测试覆盖率提升

**提升策略**:
1. **P0 文件**: 优先提升低覆盖率 hooks
2. **P1 文件**: 补充 UI 组件测试
3. **P2 文件**: 提升工具函数覆盖率

**测试模板**:
```typescript
// hooks/__tests__/useHomeGeneration.test.ts
import { renderHook, act } from '@testing-library/react';
import { useHomeGeneration } from '../useHomeGeneration';

describe('useHomeGeneration', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useHomeGeneration());
    expect(result.current.status).toBe('idle');
  });

  it('should handle generation flow', async () => {
    const { result } = renderHook(() => useHomeGeneration());
    
    await act(async () => {
      await result.current.generate('test requirement');
    });
    
    expect(result.current.status).toBe('done');
  });
});
```

---

## 三、技术风险

### 3.1 风险矩阵

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| E2E 环境复杂度高 | 🟡 中 | 高 | 使用 Docker 容器化环境 |
| React Query 迁移影响现有功能 | 🟡 中 | 中 | 增量迁移，逐步验证 |
| 测试覆盖率提升工作量超预期 | 🟡 中 | 中 | 优先低覆盖率文件 |
| CI/CD 环境配置问题 | 🟢 低 | 中 | 提前配置 CI 测试 |

### 3.2 依赖风险

| 依赖 | 风险 | 说明 |
|------|------|------|
| 后端服务 | 🟡 中 | E2E 测试需要后端运行 |
| Playwright 浏览器 | 🟢 低 | CI 环境可能缺少 |
| 测试数据 | 🟡 中 | 需要模拟数据 |

---

## 四、验收标准

### 4.1 React Query 集成

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| RQ-001 | 所有 API 调用使用 React Query hooks | `grep -r "fetch(" src/` 无结果 |
| RQ-002 | QueryProvider 测试覆盖率 ≥ 90% | Jest 覆盖报告 |
| RQ-003 | 缓存配置统一且生效 | 验证缓存行为 |
| RQ-004 | 离线持久化正常工作 | 断网测试 |

### 4.2 E2E 测试环境

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| E2E-001 | 所有 E2E 测试可运行 | `npx playwright test` |
| E2E-002 | E2E 通过率 ≥ 90% | Playwright 报告 |
| E2E-003 | CI 环境测试正常 | GitHub Actions |
| E2E-004 | 测试报告自动生成 | HTML 报告存在 |

### 4.3 测试覆盖率

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| TC-001 | Lines 覆盖率 ≥ 65% | Jest 覆盖报告 |
| TC-002 | Branches 覆盖率 ≥ 60% | Jest 覆盖报告 |
| TC-003 | P0 文件覆盖率 ≥ 80% | Jest 覆盖报告 |
| TC-004 | 无 0% 覆盖文件 | `coverage-summary.json` |

---

## 五、工作量估算

### 5.1 按模块拆分

| 模块 | 任务 | 工作量 | 负责人 |
|------|------|--------|--------|
| **React Query** | 迁移 useDDDStream | 0.5 天 | Dev |
| | 迁移 useApiCall | 0.5 天 | Dev |
| | QueryProvider 测试补充 | 0.5 天 | Dev |
| | 缓存配置优化 | 0.5 天 | Dev |
| **E2E 测试** | 环境配置验证 | 0.5 天 | Tester |
| | 修复失败测试 | 1 天 | Tester |
| | CI 配置 | 0.5 天 | Tester |
| **覆盖率提升** | P0 文件测试补充 | 1.5 天 | Tester |
| | P1 文件测试补充 | 1 天 | Tester |
| **总计** | | **6 天** | |

### 5.2 时间安排

```
Day 1: React Query 迁移 + E2E 环境验证
Day 2: React Query 测试 + E2E 修复
Day 3: E2E CI 配置 + 覆盖率 P0 提升
Day 4-5: 覆盖率 P1 提升 + 回归测试
Day 6: 验收 + 文档
```

---

## 六、下一步行动

1. **PM**: 创建 PRD，细化 Epic/Story
2. **Architect**: 设计 React Query 迁移方案
3. **Dev**: 开始 React Query 迁移
4. **Tester**: 验证 E2E 环境

---

## 七、分析检查清单

- [x] 业务场景识别：React Query 全面集成、E2E 修复、覆盖率提升
- [x] 技术方案设计：迁移策略、修复步骤、提升策略
- [x] 技术风险评估：环境复杂度、迁移影响、工作量风险
- [x] 验收标准定义：覆盖率目标、E2E 通过率、集成验证
- [x] 工作量估算：6 人日

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-phase1-infra-20260317/analysis.md`