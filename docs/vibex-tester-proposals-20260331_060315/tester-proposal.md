# Tester Proposal — vibex 测试基础设施与流程优化
> **Date**: 2026-03-31
> **Agent**: tester
> **Project**: vibex-tester-proposals-20260331_060315

---

## 1. 执行摘要

本提案从测试视角分析当前 vibex 项目在测试基础设施、流程和工具方面存在的问题，并提出优化方向。核心问题集中在：Playwright E2E 测试环境不稳定、gstack browse 模块损坏、ESLint pre-test 检查频繁失败、测试覆盖率不足 80% 目标。

---

## 2. 问题分析

### P0 — 阻断性问题

#### 2.1 Playwright E2E 测试环境无法运行

**问题描述**：
- Playwright 测试在主会话中持续超时/挂起，无法完成
- 多次测试尝试均无法获得测试结果
- 子 agent 隔离运行时可以完成，但主会话阻塞

**影响范围**：
- 无法进行端到端功能验证
- `gstack browse` 浏览器验证无法执行
- 违反了 AGENTS.md 中"强制使用 gstack browse 验证"的要求

**根本原因**：
- Playwright 浏览器进程与 Node.js 环境冲突
- 浏览器启动后无法正常关闭，导致后续测试挂起

**建议方案**：
```
1. 在 sandbox 环境运行 Playwright
2. 使用 --headed=false 强制无头模式
3. 设置 PLAYWRIGHT_BROWSERS_PATH 环境变量
4. 添加超时保护（--timeout=30000）
```

#### 2.2 gstack browse 模块缺失

**问题描述**：
- gstack browse 服务启动失败：`error: Cannot find module './browser-manager'`
- 无法使用 `/browse` 技能进行 UI 验证

**影响范围**：
- 无法进行强制性的浏览器验证
- 违反了 AGENTS.md 中的 gstack 验证要求

**建议方案**：
```
1. 重新安装 gstack browse 模块
2. 运行: cd /root/.openclaw/gstack && bun run build
3. 或从 clawhub 重新安装: clawhub install gstack-browse
```

### P1 — 严重问题

#### 2.3 ESLint pre-test 检查失败

**问题描述**：
- `npm test` 前的 pre-test 检查会运行 ESLint
- ESLint 有 418 个 warning（未使用变量），导致 pre-test 失败
- 测试被阻塞在 pre-test 阶段

**影响范围**：
- 无法直接运行 `npm test`
- 必须绕过 pre-test 检查或使用 `npx jest` 直接运行

**建议方案**：
```
1. 修复 ESLint warning（未使用变量）
2. 或修改 pre-test-check.js 允许 warning
3. ESLint 配置改为 --max-warnings=999
```

#### 2.4 测试覆盖率不足 80% 目标

**问题描述**：
- 当前行覆盖率：61.33%（目标 80%，差距 -18.67%）
- 分支覆盖率：50.57%（目标 80%，差距 -29.43%）
- 多个页面级组件覆盖率 < 20%

**影响范围**：
- Epic3 测试验证失败
- 代码质量风险增加
- 重构和变更风险提高

**根本原因**：
- 15 个 CardTreeNode 测试失败（useReactFlow mock 问题）
- 大量组件未编写单元测试

**建议方案**：
```
1. 修复 CardTreeNode useReactFlow mock
2. 为以下组件增加测试覆盖：
   - DomainPageContent (< 20%)
   - 页面级组件
3. 设定最低覆盖率 gate（CI 阻断）
```

### P2 — 一般问题

#### 2.5 单元测试环境配置不一致

**问题描述**：
- Vitest/Jest 配置分散在多个文件
- Playwright 有两套 testDir 配置（tests/e2e 和 e2e）
- E2E 测试文件位置不明确

**建议方案**：
```
1. 统一测试文件位置：
   - 单元测试: src/__tests__/
   - E2E 测试: e2e/
2. Jest 配置移到 jest.config.ts
3. Playwright 配置统一
```

#### 2.6 测试数据管理不规范

**问题描述**：
- 测试使用 mock 数据分散在各个测试文件
- exampleData.test.ts 存在但使用率低
- 测试 fixtures 缺少集中管理

**建议方案**：
```
1. 建立 tests/fixtures/ 目录
2. 统一管理 mock 数据
3. 使用 factory 模式生成测试数据
```

---

## 3. 优化建议优先级

| 优先级 | 问题 | 影响 | 预计工时 |
|--------|------|------|----------|
| P0 | Playwright E2E 无法运行 | 阻断所有 E2E 验证 | 4h |
| P0 | gstack browse 模块损坏 | 无法浏览器验证 | 2h |
| P1 | ESLint pre-test 失败 | 阻塞测试运行 | 2h |
| P1 | 覆盖率不足 80% | Epic3 验收失败 | 8h |
| P2 | 测试配置不规范 | 维护成本高 | 4h |
| P2 | 测试数据管理 | 测试稳定性差 | 4h |

---

## 4. 实施路径

### Phase 1: 修复阻断问题（1天）
1. 修复 gstack browse 模块
2. 配置 Playwright 在 sandbox 环境运行
3. 修复 ESLint pre-test 检查

### Phase 2: 提升覆盖率（2天）
1. 修复 CardTreeNode mock 问题
2. 为低覆盖率组件增加测试
3. 设置 CI 覆盖率 gate

### Phase 3: 规范化（1天）
1. 统一测试配置
2. 建立 fixtures 管理
3. 编写测试规范文档

---

## 5. 验收标准

- [ ] Playwright E2E 测试可以正常运行
- [ ] gstack browse 可以启动并验证页面
- [ ] ESLint pre-test 检查通过（或可配置绕过）
- [ ] 行覆盖率 ≥ 80%
- [ ] 分支覆盖率 ≥ 80%
- [ ] 测试配置文档化

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Playwright 环境问题复杂 | 高 | 高 | 深入调查环境依赖 |
| 覆盖率提升需要大量测试编写 | 中 | 中 | 优先覆盖关键组件 |
| ESLint warning 修复需要改大量文件 | 中 | 低 | 使用自动修复工具 |

---

*提案人: tester*
*日期: 2026-03-31*
