# 质量优化 Phase 1 需求分析

**项目**: vibex-quality-optimization-20260317  
**分析师**: Analyst Agent  
**日期**: 2026-03-17  
**状态**: ✅ 分析完成

---

## 执行摘要

**目标**: 实施 P0 提案，提升项目质量和开发效率

**核心指标**:
| 指标 | 当前值 | 目标值 | 预期收益 |
|------|--------|--------|----------|
| 测试覆盖率 (Lines) | 61.45% | 65%+ | 质量门禁达标 |
| 测试覆盖率 (Branches) | 51.25% | 60%+ | 边界条件覆盖 |
| React Query 集成率 | 55% | 90%+ | 代码一致性 |
| PRD 模板使用率 | 0% | 80%+ | 需求质量 |

**总工作量**: 10.5 人日

---

## 一、业务场景

### 1.1 问题背景

基于 2026-03-17 Agent 自检提案汇总，识别出以下核心问题：

| 问题类别 | 具体问题 | 影响范围 |
|----------|----------|----------|
| 测试质量 | 覆盖率未达标、低覆盖率文件多 | 质量风险高 |
| 架构一致 | React Query 集成不完整 | 维护成本高 |
| 流程规范 | PRD 模板不统一 | 协作效率低 |
| 安全保障 | 缺乏自动检测机制 | 漏洞风险 |

### 1.2 目标用户

| 角色 | 痛点 | 期望 |
|------|------|------|
| 开发者 | 测试补充困难、API 调用不一致 | 统一工具、清晰指南 |
| PM | PRD 质量参差、验收标准模糊 | 标准模板、检查清单 |
| Reviewer | 审查标准不一、安全漏洞遗漏 | 统一清单、自动检测 |
| Architect | 技术债积累、覆盖率不达标 | 技术统一、质量门禁 |

---

## 二、技术方案

### 2.1 测试覆盖率提升

**目标**: Lines ≥ 65%, Branches ≥ 60%

**低覆盖率文件优先级**:
| 文件 | 当前 | 目标 | 优先级 |
|------|------|------|--------|
| useHomeGeneration.ts | 1.66% | 80% | P0 |
| useHomePageState.ts | 8.33% | 80% | P0 |
| useHomePanel.ts | 7.5% | 80% | P0 |
| ThinkingPanel.tsx | 3.12% | 70% | P0 |
| AIPanel.tsx | 9.09% | 70% | P1 |
| api-config.ts | 20% | 80% | P1 |

**实施路径**:
```
Week 1: P0 Hooks 测试补充 (useHomeGeneration, useHomePageState, useHomePanel)
Week 2: P0 Components 测试补充 (ThinkingPanel)
Week 3: P1 文件测试补充 (AIPanel, api-config)
```

**技术方案**:
```typescript
// test-utils/component-test-utils.ts
export function renderWithProviders(
  ui: ReactElement,
  options?: { queryClient?: QueryClient }
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

---

### 2.2 React Query 统一集成

**目标**: API 调用全部使用 React Query hooks

**迁移清单**:
| 组件/文件 | 当前方式 | 目标方式 | 工作量 |
|-----------|----------|----------|--------|
| useDDDStream.ts | 原生 fetch | useMutation | 0.5 天 |
| useApiCall.ts | 自定义 hook | useQuery/useMutation | 0.5 天 |
| services/api/client.ts | 封装 fetch | React Query client | 0.5 天 |
| QueryProvider 测试 | 55% | 90%+ | 1 天 |
| Query Keys 统一 | 分散定义 | 工厂模式 | 0.5 天 |

**统一 Query Keys**:
```typescript
// lib/query/keys.ts
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
  },
  contexts: {
    all: ['contexts'] as const,
    byProject: (projectId: string) => [...queryKeys.contexts.all, projectId] as const,
  },
  // ...
};
```

---

### 2.3 PRD 模板标准化

**目标**: 统一 PRD 格式，减少需求遗漏

**模板结构**:
```markdown
# PRD: [功能名称]

## 1. 问题定义
| 问题 | 根因 | 影响 | 解决方案 |
|------|------|------|----------|
| [问题描述] | [根本原因] | [影响范围] | [解决方案] |

## 2. 验收标准
- [ ] AC-001: [可测试的验收条件]
- [ ] AC-002: [可测试的验收条件]

## 3. Epic 拆分
| Epic ID | 描述 | 预估工时 |
|---------|------|----------|
| E-001 | [Epic 描述] | 1-2h |

## 4. 风险评估
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
```

**验收条件审查清单**:
- [ ] 是否有明确的数值指标？
- [ ] 是否有负面场景覆盖？
- [ ] 是否有边界条件说明？

---

### 2.4 安全漏洞自动检测

**目标**: 自动检测依赖漏洞和硬编码密钥

**实施方案**:
```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=moderate
      - run: npx hard-coded-secrets-scanner
```

**检测规则**:
| 规则 | 检测内容 | 严重级别 |
|------|----------|----------|
| npm audit | 依赖漏洞 | moderate+ |
| 硬编码密钥 | API keys, tokens | high |
| 敏感文件 | .env 上传 | critical |

---

## 三、技术风险

### 3.1 风险矩阵

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 测试补充引入新 bug | 中 | 中 | 回归测试覆盖 |
| React Query 迁移影响功能 | 中 | 高 | 增量迁移，逐步验证 |
| PRD 模板推广阻力 | 低 | 低 | 培训 + 示例 |
| 安全检测误报 | 低 | 低 | 白名单配置 |

### 3.2 依赖关系

```
测试覆盖率提升 ──┐
                  ├──→ 质量门禁 ──→ CI 流程
React Query 集成 ─┘

PRD 模板 ──→ 验收条件清单 ──→ Epic 拆分指南
```

---

## 四、验收标准

### 4.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| QO-001 | Lines 覆盖率 ≥ 65% | Jest 覆盖报告 |
| QO-002 | Branches 覆盖率 ≥ 60% | Jest 覆盖报告 |
| QO-003 | P0 文件覆盖率 ≥ 80% | Jest 覆盖报告 |
| QO-004 | 所有 API 调用使用 React Query | `grep -r "fetch(" src/` 无结果 |
| QO-005 | QueryProvider 覆盖率 ≥ 90% | Jest 覆盖报告 |
| QO-006 | PRD 模板创建完成 | 文件存在 |
| QO-007 | 验收条件清单创建完成 | 文件存在 |
| QO-008 | 安全扫描集成到 CI | GitHub Actions 运行 |

### 4.2 质量门禁

```yaml
# 覆盖率门禁
coverageThreshold:
  global:
    lines: 65
    branches: 60
    functions: 60
  # P0 文件单独设置
  './src/components/homepage/hooks/': 
    lines: 80
```

---

## 五、工作量估算

| 阶段 | 内容 | 工作量 | 负责人 |
|------|------|--------|--------|
| **测试覆盖率** | P0 Hooks 测试 | 2 天 | Tester/Dev |
| | P0 Components 测试 | 1 天 | Tester/Dev |
| | 覆盖率门禁配置 | 0.5 天 | Architect |
| **React Query** | 迁移 useDDDStream | 0.5 天 | Dev |
| | 迁移 useApiCall | 0.5 天 | Dev |
| | QueryProvider 测试 | 1 天 | Tester |
| | Query Keys 统一 | 0.5 天 | Dev |
| **流程规范** | PRD 模板创建 | 0.5 天 | PM |
| | 验收条件清单 | 0.5 天 | PM |
| **安全保障** | 安全扫描集成 | 1 天 | Reviewer |
| **总计** | | **10.5 天** | |

---

## 六、下一步行动

1. **PM**: 创建 PRD，细化 Epic/Story
2. **Architect**: 设计技术方案细节
3. **Dev**: 开始 React Query 迁移
4. **Tester**: 补充测试用例
5. **Reviewer**: 配置安全扫描

---

## 七、分析检查清单

- [x] 业务场景识别：测试质量、架构一致性、流程规范、安全保障
- [x] 技术方案设计：覆盖率提升、React Query 迁移、模板标准化、安全检测
- [x] 技术风险评估：测试影响、迁移风险、推广阻力
- [x] 验收标准定义：8 条可测试条件
- [x] 工作量估算：10.5 人日

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-quality-optimization-20260317/analysis.md`