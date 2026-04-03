# Product Requirements Document: Vibex 质量优化 Phase 1

**项目**: vibex-quality-optimization-20260317  
**PM**: PM Agent  
**日期**: 2026-03-17  
**状态**: ✅ PRD 完成

---

## 1. 问题定义

| 问题 | 根因 | 影响 | 解决方案 |
|------|------|------|----------|
| 测试覆盖率未达标 | 缺乏测试补充机制 + 低覆盖率文件堆积 | 质量风险高，Bug 频发 | 目标 Lines≥65%, Branches≥60% |
| React Query 集成不完整 | API 调用方式不统一，散布原生 fetch | 维护成本高，状态管理混乱 | 统一使用 React Query Hooks |
| PRD 模板不统一 | 缺乏标准化流程和模板 | 需求质量参差，验收标准模糊 | 创建 PRD 模板 + 验收清单 |
| 缺乏自动安全检测 | CI 流程无安全扫描 | 漏洞风险，无感知 | 集成 GitHub Actions 安全扫描 |

---

## 2. 成功指标

| 指标 | 当前值 | 目标值 | 测量方法 |
|------|--------|--------|----------|
| 测试覆盖率 (Lines) | 61.45% | ≥65% | Jest coverage report |
| 测试覆盖率 (Branches) | 51.25% | ≥60% | Jest coverage report |
| React Query 集成率 | 55% | ≥90% | grep 检查无原生 fetch |
| PRD 模板使用率 | 0% | ≥80% | 模板文件存在并使用 |
| 安全扫描集成 | 无 | 已集成 | GitHub Actions 运行成功 |

---

## 3. Epic 拆分

### Epic 1: 测试覆盖率提升

**目标**: 整体覆盖率达标，P0 文件覆盖率显著提升

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | P0 Hooks 测试补充 | 为 useHomeGeneration, useHomePageState, useHomePanel 补充测试 | `expect(coverage['useHomeGeneration.ts'].lines).toBeGreaterThanOrEqual(80)` | - |
| F1.2 | P0 Components 测试补充 | 为 ThinkingPanel 补充测试 | `expect(coverage['ThinkingPanel.tsx'].lines).toBeGreaterThanOrEqual(70)` | 【需页面集成】 |
| F1.3 | P1 文件测试补充 | 为 AIPanel, api-config 补充测试 | `expect(coverage['AIPanel.tsx'].lines).toBeGreaterThanOrEqual(70)` | 【需页面集成】 |
| F1.4 | QueryProvider 测试提升 | 提升 QueryProvider 覆盖率 | `expect(coverage['QueryProvider.tsx'].lines).toBeGreaterThanOrEqual(90)` | - |
| F1.5 | 覆盖率门禁配置 | 在 package.json 配置 coverageThreshold | `npm run test -- --coverage` 失败时退出码非 0 | - |

#### Epic 1 验收条件
- [ ] AC-1.1: 全局 Lines 覆盖率 ≥ 65%
- [ ] AC-1.2: 全局 Branches 覆盖率 ≥ 60%
- [ ] AC-1.3: P0 Hooks 文件覆盖率 ≥ 80%
- [ ] AC-1.4: P0 Components 文件覆盖率 ≥ 70%
- [ ] AC-1.5: coverageThreshold 配置生效，低于阈值时 CI 失败

---

### Epic 2: React Query 统一集成

**目标**: 所有 API 调用使用 React Query，统一状态管理

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | useDDDStream 迁移 | 将 useDDDStream.ts 从原生 fetch 迁移到 useMutation | `grep -r "fetch(" src/hooks/useDDDStream.ts` 返回空 | - |
| F2.2 | useApiCall 迁移 | 将 useApiCall.ts 迁移到 useQuery/useMutation | `grep -r "fetch(" src/hooks/useApiCall.ts` 返回空 | - |
| F2.3 | Query Keys 统一 | 扩展 lib/query/keys.ts，使用工厂模式 | `test -f src/lib/query/keys.ts` + 代码审查通过 | - |
| F2.4 | 测试工具创建 | 创建 renderWithProviders 和 Mock 工厂 | `test -f src/test-utils/component-test-utils.ts` | - |

#### Epic 2 验收条件
- [ ] AC-2.1: 无原生 fetch 调用 (grep 检查返回空)
- [ ] AC-2.2: Query Keys 统一管理
- [ ] AC-2.3: 测试工具可用且测试通过
- [ ] AC-2.4: 所有 React Query hooks 使用统一 keys

---

### Epic 3: PRD 模板标准化

**目标**: 统一 PRD 格式，减少需求遗漏

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | PRD 模板创建 | 创建标准 PRD 模板文件 | `test -f templates/prd-template.md` | - |
| F3.2 | 验收条件清单 | 创建验收条件审查清单 | `test -f templates/acceptance-checklist.md` | - |
| F3.3 | Epic 拆分指南 | 创建 Epic 拆分指南文档 | `test -f templates/epic-breakdown-guide.md` | - |

#### Epic 3 验收条件
- [ ] AC-3.1: PRD 模板文件存在且格式完整
- [ ] AC-3.2: 验收条件清单包含必要检查项
- [ ] AC-3.3: Epic 拆分指南包含 4 个核心字段

---

### Epic 4: 安全扫描集成

**目标**: 自动检测依赖漏洞和硬编码密钥

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | npm audit 集成 | 在 CI 中运行 npm audit | `npm audit --audit-level=moderate` 在 CI 中运行 | - |
| F4.2 | 硬编码密钥检测 | 集成 gitleaks 检测硬编码密钥 | `npx gitleaks detect` 在 CI 中运行 | - |
| F4.3 | 敏感文件检查 | 检查 .env 等敏感文件是否上传 | CI 中检测逻辑运行 | - |
| F4.4 | 安全扫描工作流 | 创建 GitHub Actions 工作流文件 | `test -f .github/workflows/security-scan.yml` | - |

#### Epic 4 验收条件
- [ ] AC-4.1: npm audit 在 CI 中运行
- [ ] AC-4.2: 硬编码密钥检测在 CI 中运行
- [ ] AC-4.3: 安全扫描工作流文件存在
- [ ] AC-4.4: CI 运行成功无阻断

---

## 4. 工作量估算

| Epic | 内容 | 工作量 | 负责人 |
|------|------|--------|--------|
| **Epic 1** | 测试覆盖率提升 | 4 天 | Dev/Tester |
| | P0 Hooks 测试补充 | 2 天 | Tester |
| | P0 Components 测试补充 | 1 天 | Tester |
| | 覆盖率门禁配置 | 0.5 天 | Architect |
| **Epic 2** | React Query 统一集成 | 2 天 | Dev |
| | useDDDStream 迁移 | 0.5 天 | Dev |
| | useApiCall 迁移 | 0.5 天 | Dev |
| | 测试工具创建 | 0.5 天 | Dev |
| | Query Keys 统一 | 0.5 天 | Dev |
| **Epic 3** | PRD 模板标准化 | 1 天 | PM |
| | PRD 模板创建 | 0.5 天 | PM |
| | 验收条件清单 | 0.5 天 | PM |
| **Epic 4** | 安全扫描集成 | 1 天 | Reviewer |
| | 安全扫描工作流 | 1 天 | Reviewer |
| **总计** | | **8 人日** | |

---

## 5. 依赖关系

```
Epic 1 (测试覆盖率) ──┐
                      ├──→ Epic 2 (React Query) ──→ Epic 4 (安全扫描)
Epic 3 (PRD 模板) ────┘
```

---

## 6. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 测试补充引入新 bug | 中 | 中 | 回归测试覆盖 |
| React Query 迁移影响功能 | 中 | 高 | 增量迁移，逐步验证 |
| 覆盖率门禁阻塞发布 | 低 | 中 | 分阶段提升阈值 |
| 安全扫描误报 | 低 | 低 | 白名单配置 |

---

## 7. 下一步行动

1. **Dev**: 开始 Epic 1 测试补充
2. **Tester**: 补充 P0 Hooks 测试用例
3. **Reviewer**: 配置 Epic 4 安全扫描

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-quality-optimization-20260317/prd.md`
