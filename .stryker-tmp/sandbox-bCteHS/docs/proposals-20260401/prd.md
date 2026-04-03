# PRD: proposals-20260401 — 团队提案综合落地

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

2026-04-01 提案收集周期共汇总 7 个 Agent（analyst × 2、dev、architect、pm、tester、reviewer），去重后共识别 **33 条独立提案**，涵盖开发环境阻塞、协作质量、Canvas 体验、竞品分析、质量流程、架构演进六大主题。

### 目标

通过 7 个独立 Epic 分阶段解决 P0 阻塞问题（P0 工时 13.5h），建立中长期质量与架构体系（P1 工时 56h），实现团队协作透明化、代码质量可量化、用户体验可追踪。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| P0 Epic 交付率 | 100%（4/4 个 P0 Epic） | Epic 验收通过计数 |
| P0 工时控制 | ≤ 13.5h | 开发记录工时 |
| E2E 测试覆盖率 | ≥ 5 个 CI-blocking 用例 | CI 测试报告 |
| Canvas bug 修复 | 选区过滤 100% 准确 | E2E 验证 |
| 协作错误率 | 越权编辑 0 次/月 | 文件锁日志 |
| 新用户引导完成率 | ≥ 80% | 引导步骤埋点 |

---

## 2. Epic 拆分（方案 B — 适度拆分）

### Epic 总览

| Epic | 名称 | 工时 | 优先级 | 依赖 | 产出文件 |
|------|------|------|--------|------|----------|
| E1 | 开发环境阻塞修复 | 3.5h | P0 | 无 | specs/e1-dev-env-fix.md |
| E2 | 协作质量防护 | 7h | P0 | 无 | specs/e2-collab-quality.md |
| E3 | Canvas 选区 bug 修复 | 2h | P0 | 无 | specs/e3-canvas-selection-bug.md |
| E4 | 画布引导体系 | 8h | P0 | E3 完成后 | specs/e4-canvas-guidance.md |
| E5 | 质量流程改进 | 19h | P1 | 无 | specs/e5-quality-process.md |
| E6 | 竞品与市场分析 | 13h | P1 | 无 | specs/e6-competitive-analysis.md |
| E7 | 架构演进 | 17h | P1 | 无 | specs/e7-arch-evolution.md |

**总工时**: 69.5h（≈ 3 周 1 人月）

---

### Epic 1: 开发环境阻塞修复

**工时**: 3.5h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E1-S1 | Backend TypeScript pre-test 修复 | 1.5h | `npm test --workspace backend -- --passWithNoTests` 全绿；CI 报告无 TS 错误 |
| E1-S2 | Frontend TypeScript pre-test 修复 | 1h | `npx tsc --noEmit` 返回 0 error；CI pre-test 通过 |
| E1-S3 | task_manager.py 文件锁 Bug | 1h | 并发调用 `claim` 不产生死锁；日志无 `FileNotFoundError` |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Backend TS pre-test | 修复 `pretest` 脚本，移除阻塞性 tsconfig 限制 | `expect(result.exitCode).toBe(0)` | ❌ |
| F1.2 | Frontend TS pre-test | 修复 `tsconfig.json` 中的 `strict` 溢出 | `expect(tsErrors).toBe(0)` | ❌ |
| F1.3 | 文件锁 Bug | 重构文件锁逻辑，处理并发 edge case | `expect(lockCount).toBeLessThanOrEqual(1)` | ❌ |

#### DoD

- [ ] CI pre-test 全绿（Backend + Frontend）
- [ ] `npm run pretest` 在本地通过
- [ ] 并发测试通过（3 并发 claim 调用）
- [ ] 代码审查通过（reviewer 无驳回）

---

### Epic 2: 协作质量防护

**工时**: 7h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E2-S1 | JSON 越权编辑防护 | 实现文件锁保护，禁止非锁持有者编辑 | `expect(editWithoutLock).toBeRejected()` |
| E2-S2 | 自检报告路径规范 | 所有 agent 自检报告统一路径格式 | `expect(reportPath).toMatch(/proposals-YYYYMMDD\//)` |
| E2-S3 | 重复通知过滤 | Feishu 通知去重，避免同一消息重复发送 | `expect(dupCount).toBe(0)` |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 越权编辑拦截 | `update` 时检查文件锁持有者，不匹配则抛出异常 | `expect(updateWithoutLock).toThrow('LockRequired')` | ❌ |
| F2.2 | 路径规范校验 | 自检报告写入前校验路径合法性 | `expect(pathRegex.test(reportPath)).toBe(true)` | ❌ |
| F2.3 | 通知去重 | 消息内容 hash 去重，30min 内相同内容不重复发送 | `expect(duplicateMessages).toBe(0)` | ❌ |

#### DoD

- [ ] `update done` 在无锁时抛出 `LockRequired` 异常（预期行为）
- [ ] 所有 agent 自检报告在 `proposals/YYYYMMDD/` 目录下
- [ ] Feishu 通知重复率降至 0
- [ ] reviewer 两阶段审查通过

---

### Epic 3: Canvas 选区 bug 修复

**工时**: 2h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E3-S1 | 选区过滤逻辑修复 | 修复 `selectedNodeIds` vs `confirmed` 混用问题 | deselect 后已选卡片不再出现在发送请求中 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | Canvas 选区过滤 | 用户 deselect 后，`selectedNodeIds` 立即更新；继续发送请求时仅包含当前选中节点 | `expect(sentNodeIds).toEqual(selectedNodeIds)` | 【需页面集成】 |

#### DoD

- [ ] 选中卡片 → deselect → 点击继续，请求体仅包含当前选中卡片
- [ ] E2E 测试覆盖此场景（Playwright）
- [ ] 代码审查通过

---

### Epic 4: 画布引导体系

**工时**: 8h | **优先级**: P0 | **依赖**: E3 完成后 | **可并行**: ❌

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E4-S1 | 新用户引导流程 | 首次打开画布触发引导提示（3 步引导） | 引导完成率 ≥ 80%；首次触发时间 < 30s |
| E4-S2 | 快捷键提示 | 显示常用快捷键（⌘+Z, ⌘+C, ⌘+V 等） | 快捷键面板可显示/隐藏 |
| E4-S3 | 节点 Tooltip | Hover 节点显示节点基本信息 | tooltip 响应时间 < 200ms |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 引导流程 | Step-by-step overlay 引导，覆盖核心操作 | `expect(completionRate).toBeGreaterThanOrEqual(0.8)` | 【需页面集成】 |
| F4.2 | 快捷键提示 | 画布工具栏增加快捷键按钮 | `expect(isVisible(shortcutBtn)).toBe(true)` | 【需页面集成】 |
| F4.3 | 节点 Tooltip | React Flow 节点增加 Hover tooltip | `expect(tooltipLatency).toBeLessThan(200)` | 【需页面集成】 |

#### DoD

- [ ] 新用户首次打开画布，30s 内触发引导
- [ ] 引导步骤可跳过但不影响核心使用
- [ ] 快捷键提示面板可折叠/展开
- [ ] 100 节点下 tooltip 延迟 < 200ms

---

### Epic 5: 质量流程改进

**工时**: 19h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E5-S1 | E2E Playwright 测试规范 | 制定并落地 Playwright 测试规范 | ≥ 5 个 CI-blocking 用例 |
| E5-S2 | CI 测试质量 Gate | 测试覆盖率 < 80% 时 CI 失败 | `expect(coverage).toBeGreaterThanOrEqual(80)` |
| E5-S3 | 两阶段审查 SOP | 明确 reviewer → architect 两阶段审查流程 | SOP 文档存在且可执行 |
| E5-S4 | 验收标准明确化 | 统一 DoD 格式，所有 Story 必须有 expect() 断言 | 所有新 Story 验收标准 `expect()` 格式 |
| E5-S5 | KPI 量化体系 | 定义团队 KPI（交付率、bug 率、阻塞时间） | KPI dashboard 存在且可更新 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | Playwright 规范 | 测试目录结构、命名规范、page object 模式 | `expect(testCount).toBeGreaterThanOrEqual(5)` | ❌ |
| F5.2 | CI Gate | GitHub Actions 增加 coverage gate | `expect(coverage >= 80).toBe(true)` | ❌ |
| F5.3 | SOP 文档 | 两阶段审查 SOP Markdown 文档 | `expect(sopDoc.exists).toBe(true)` | ❌ |
| F5.4 | 验收标准模板 | PRD 模板要求每 Story 含 expect() | `expect(acFormat.test(ac)).toBe(true)` | ❌ |
| F5.5 | KPI Dashboard | notion 或独立 dashboard 显示 KPI | `expect(kpiExists).toBe(true)` | ❌ |

#### DoD

- [ ] CI 测试覆盖率 ≥ 80%（E5-S2）
- [ ] ≥ 5 个 E2E 用例 CI blocking（E5-S1）
- [ ] SOP 文档经 reviewer 确认（E5-S3）
- [ ] 所有新 PRD 包含 expect() 验收标准（E5-S4）

---

### Epic 6: 竞品与市场分析

**工时**: 13h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E6-S1 | 竞品功能对比矩阵 | 5+ 竞品季度对比（Cursor, Copilot, Claude Code 等） | 矩阵文档包含 ≥ 5 个竞品 |
| E6-S2 | 用户旅程图分析 | 5+ 关键场景痛点识别 | 旅程图包含 5+ 关键节点 |
| E6-S3 | 用户细分与定价策略 | 4+ 用户群体付费意愿分析 | 细分文档包含 ≥ 3 个定价方案 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | 竞品矩阵 | Markdown 表格，含功能/价格/用户量对比 | `expect(competitorCount).toBeGreaterThanOrEqual(5))` | ❌ |
| F6.2 | 旅程图 | Mermaid journey map，含 5+ 关键场景 | `expect(keySceneCount).toBeGreaterThanOrEqual(5))` | ❌ |
| F6.3 | 定价策略 | 3+ 定价方案（含免费/Pro/Enterprise） | `expect(pricingPlanCount).toBeGreaterThanOrEqual(3))` | ❌ |

#### DoD

- [ ] 竞品矩阵文档存在且包含 ≥ 5 个竞品
- [ ] 用户旅程图包含 5+ 关键场景
- [ ] 定价策略文档包含 ≥ 3 个方案
- [ ] 数据来源可引用（gstack browse 截图或 API）

---

### Epic 7: 架构演进

**工时**: 17h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E7-S1 | React Flow 性能优化 | 100 节点 Flow PAN 操作 ≥ 30 FPS | `expect(fps).toBeGreaterThanOrEqual(30)` |
| E7-S2 | 架构文档版本化 | domain.md 所有章节有更新日期 | `expect(chapterDates.every(d => d !== null)).toBe(true)` |
| E7-S3 | API Route 服务层拆分 | `pages/api/` 路由拆分独立服务层 | API 层职责单一，不直接操作 DB |
| E7-S4 | canvasApi 响应校验 | canvasApi 响应增加 schema 校验 | `expect(validationErrors).toBe(0)` |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F7.1 | Flow 性能 | React Flow memo + viewport 优化 | `expect(fps >= 30).toBe(true)` | ❌ |
| F7.2 | 文档版本化 | domain.md 添加 `@updated` 注解 | `expect(updatedChapters >= totalChapters).toBe(true)` | ❌ |
| F7.3 | API 拆分 | API route 调用 service 层，service 层可独立测试 | `expect(serviceMethods >= 3).toBe(true)` | ❌ |
| F7.4 | 响应校验 | Zod schema 验证 canvasApi 响应 | `expect(validationPass).toBe(true)` | ❌ |

#### DoD

- [ ] React Flow 100 节点性能测试通过（FPS ≥ 30）
- [ ] domain.md 所有章节有 `@updated` 日期
- [ ] API route 无直接 DB 操作（全部经 service 层）
- [ ] canvasApi schema 校验测试通过

---

## 3. 验收标准（汇总）

| Epic | Story | expect() 断言 |
|------|-------|--------------|
| E1 | E1-S1 | `expect(exitCode).toBe(0)` |
| E1 | E1-S2 | `expect(tsErrors).toBe(0)` |
| E1 | E1-S3 | `expect(lockCount).toBeLessThanOrEqual(1)` |
| E2 | E2-S1 | `expect(updateWithoutLock).toThrow('LockRequired')` |
| E2 | E2-S2 | `expect(pathRegex.test(reportPath)).toBe(true)` |
| E2 | E2-S3 | `expect(duplicateMessages).toBe(0)` |
| E3 | E3-S1 | `expect(sentNodeIds).toEqual(selectedNodeIds)` |
| E4 | E4-S1 | `expect(completionRate).toBeGreaterThanOrEqual(0.8)` |
| E4 | E4-S2 | `expect(isVisible(shortcutBtn)).toBe(true)` |
| E4 | E4-S3 | `expect(tooltipLatency).toBeLessThan(200)` |
| E5 | E5-S1 | `expect(testCount).toBeGreaterThanOrEqual(5)` |
| E5 | E5-S2 | `expect(coverage).toBeGreaterThanOrEqual(80)` |
| E5 | E5-S3 | `expect(sopDoc.exists).toBe(true)` |
| E5 | E5-S4 | `expect(acFormat.test(ac)).toBe(true)` |
| E5 | E5-S5 | `expect(kpiExists).toBe(true)` |
| E6 | E6-S1 | `expect(competitorCount).toBeGreaterThanOrEqual(5)` |
| E6 | E6-S2 | `expect(keySceneCount).toBeGreaterThanOrEqual(5)` |
| E6 | E6-S3 | `expect(pricingPlanCount).toBeGreaterThanOrEqual(3)` |
| E7 | E7-S1 | `expect(fps).toBeGreaterThanOrEqual(30)` |
| E7 | E7-S2 | `expect(updatedChapters >= totalChapters).toBe(true)` |
| E7 | E7-S3 | `expect(serviceMethods >= 3).toBe(true)` |
| E7 | E7-S4 | `expect(validationPass).toBe(true)` |

---

## 4. DoD (Definition of Done)

### 全局 DoD（所有 Epic 必须满足）

1. **代码规范**: `npm run lint` 无 error
2. **TypeScript**: `npx tsc --noEmit` 0 error
3. **测试**: 所有新增功能有对应测试（单元或 E2E）
4. **审查**: PR 经过 reviewer 两阶段审查
5. **文档**: 关键变更更新相关文档

### Epic 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | CI pre-test 全绿 + 并发测试通过 |
| E2 | 越权编辑触发异常 + 路径规范校验通过 |
| E3 | E2E 测试覆盖选区场景 |
| E4 | 引导完成率 ≥ 80% + tooltip 延迟验证 |
| E5 | CI coverage gate 生效 + SOP 文档确认 |
| E6 | 数据来源可引用（截图/API） |
| E7 | 性能测试数据 + 文档版本化检查通过 |

---

## 5. 优先级矩阵

| 优先级 | Epic | 启动条件 | 建议排期 |
|--------|------|----------|----------|
| P0 | E1, E2, E3 | 立即并行 | Sprint 1（本周） |
| P0 | E4 | E3 完成后 | Sprint 1（本周后半） |
| P1 | E5, E6, E7 | 无依赖，可立即并行 | Sprint 2-3 |

### P0 并行启动建议

```
Sprint 1（本周，E1+E2+E3 并行）:
  - Dev: E1（3.5h）
  - PM+Reviewer: E2（7h）
  - Dev: E3（2h）
  → 总计 12.5h，1-2 天完成

Sprint 1 后半（E4 启动）:
  - Dev: E4（8h）
  → E4 完成 P0

Sprint 2-3:
  - E5（19h）+ E6（13h）+ E7（17h）并行
  → 总计 49h，约 2 周完成
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| **性能** | React Flow 100 节点 FPS ≥ 30；Tooltip 延迟 < 200ms |
| **可靠性** | CI 测试覆盖率 ≥ 80%；E2E CI-blocking 用例 ≥ 5 |
| **可维护性** | API route 经 service 层；文档版本化 |
| **协作** | 所有报告路径规范；两阶段审查 SOP |
| **安全** | 越权编辑拦截；文件锁并发安全 |

---

## 7. 依赖关系图

```
E3 ──→ E4
         │
         ↓
[无依赖: E1, E2, E5, E6, E7 全部可并行]

E1 ─┐
E2 ─┼─→ Sprint 1 P0（本周）
E3 ─┘

E4 ──→ Sprint 1 后半

E5 ─┐
E6 ─┼─→ Sprint 2-3
E7 ─┘
```

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 06:35 GMT+8*
