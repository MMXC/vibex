# PRD: proposals-20260401-3 — Sprint 3 提案落地

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

第三批提案来源：
1. **积压提案**（20260324 遗留 5 条）：proposal-dedup、ErrorBoundary 去重、heartbeat 幽灵任务、Undo/Redo、Accessibility 基线
2. **Sprint 1/2 执行发现**（3 条新痛点）：Changelog 手动维护、Toast/Notification 缺失、Svelte 导出缺失

### 目标

通过 5 个 Epic 消除 Sprint 1 积压问题，建立团队协作自动化（changelog-gen）、完善无障碍标准、扩展多框架导出。总工时 20h。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 通知重复率 | 0 次/周 | 通知日志重复 hash 计数 |
| changelog 自动化率 | ≥ 90% | CLI 生成占比 vs 手动编写 |
| Undo/Redo 覆盖率 | 100% 核心操作 | 快捷键测试通过率 |
| Accessibility 违规 | Critical/Serious 0 条 | axe-core 报告 |
| 框架导出覆盖 | React + Vue + Svelte | E2E 框架切换测试通过 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 工时 | 优先级 | 依赖 | 产出文件 |
|------|------|------|--------|------|----------|
| E1 | proposal-dedup + ErrorBoundary | 4h | P0 | 无 | specs/e1-proposal-dedup-eb.md |
| E2 | heartbeat + changelog 自动化 | 4h | P1 | 无 | specs/e2-heartbeat-changelog.md |
| E3 | Undo/Redo 完整实现 | 5h | P1 | Sprint 1 E4 ShortcutBar | specs/e3-undo-redo.md |
| E4 | Accessibility 测试基线 | 3h | P2 | 无 | specs/e4-accessibility.md |
| E5 | Svelte Framework 导出 | 4h | P2 | 无 | specs/e5-svelte-export.md |

**总工时**: 20h（约 1 周 1 人月）

---

### Epic 1: proposal-dedup + ErrorBoundary

**工时**: 4h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E1-S1 | 通知去重机制生产验证 | 1.5h | CLI `notify` 对相同 task_id 5min 内不重复发送 |
| E1-S2 | 统一 AppErrorBoundary 组件 | 2.5h | 画布/导出页面全部使用统一 ErrorBoundary |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 通知去重 | 相同 task_id + 5min 窗口内不重复发送（hash 去重） | `expect(dupCount).toBe(0)` | ❌ |
| F1.2 | 幂等通知检查 | `notify` CLI 加 `--check-existing` flag，检查队列状态 | `expect(exitCode).toBe(0)` | ❌ |
| F1.3 | AppErrorBoundary | `components/common/AppErrorBoundary.tsx` 统一导出 | `expect(isDefaultExport(AppErrorBoundary)).toBe(true)` | 【需页面集成】 |
| F1.4 | ErrorBoundary 替换 | 画布页面 + 导出页面替换为 AppErrorBoundary | `expect(errorBoundaryCount).toBe(1)` | 【需页面集成】 |

#### DoD

- [ ] 相同 task_id 5min 内不产生重复通知
- [ ] AppErrorBoundary 组件统一导出
- [ ] 画布/导出页面 ErrorBoundary 替换完成
- [ ] 错误 fallback UI 非白屏（友好提示）

---

### Epic 2: heartbeat + changelog 自动化

**工时**: 4h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E2-S1 | Heartbeat 幽灵任务检测 | 1.5h | activeMinutes > 60 且已完成 → 标记并修复 |
| E2-S2 | changelog-gen CLI | 2h | Angular commit format → CHANGELOG.md |
| E2-S3 | git commit-msg hook 集成 | 0.5h | commit 时自动格式校验 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 幽灵任务检测 | startedAt 有值 + completedAt 为 null + 时间差 > 60min → 触发修正 | `expect(ghostTaskCount).toBe(0)` | ❌ |
| F2.2 | 虚假完成检测 | 状态 done 但 output 文件不存在 → 标记虚假完成 | `expect(fakeDoneCount).toBe(0)` | ❌ |
| F2.3 | changelog-gen CLI | `changelog-gen --from=v1.0 --to=HEAD` 生成 CHANGELOG.md | `expect(cliExitCode).toBe(0)` | ❌ |
| F2.4 | commit-msg hook | `commit-msg` hook 校验 commit message 格式（Angular） | `expect(hookInstallSuccess).toBe(true)` | ❌ |

#### DoD

- [ ] Heartbeat 扫描无幽灵任务（activeMinutes > 60 但已完成）
- [ ] `changelog-gen --from=HEAD --to=v1.0` 生成有效 CHANGELOG
- [ ] Sprint 3 CHANGELOG 通过 CLI 生成，无需手动编写

---

### Epic 3: Undo/Redo 完整实现

**工时**: 5h | **优先级**: P1 | **依赖**: Sprint 1 E4 ShortcutBar（已存在） | **可并行**: ❌

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E3-S1 | Ctrl+Z/Y 快捷键 | 2h | Ctrl+Z 撤销，Ctrl+Y 重做 |
| E3-S2 | UndoBar UI | 1.5h | 工具栏显示撤销/重做按钮 + 步数 |
| E3-S3 | 历史栈验证 | 1.5h | 最多保留 50 步，超出自动截断 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | Ctrl+Z 撤销 | historySlice 读取，Ctrl+Z 执行 undo | `expect(undoSteps >= 1).toBe(true)` | 【需页面集成】 |
| F3.2 | Ctrl+Y 重做 | 从 redo stack 恢复，Ctrl+Y 执行 redo | `expect(redoSteps >= 1).toBe(true)` | 【需页面集成】 |
| F3.3 | UndoBar 组件 | ShortcutBar 增加 Undo/Redo 按钮 + 步数显示 | `expect(isVisible(undoBar)).toBe(true)` | 【需页面集成】 |
| F3.4 | 历史栈限制 | historyStack maxLength = 50，超出时 shift() | `expect(stackLength).toBeLessThanOrEqual(50)` | ❌ |

#### DoD

- [ ] Ctrl+Z 撤销最近一次节点操作（添加/删除/编辑）
- [ ] Ctrl+Y 重做被撤销的操作
- [ ] UndoBar 显示当前可撤销步数
- [ ] 50 步历史栈，超出自动截断
- [ ] Playwright E2E 覆盖撤销/重做场景

---

### Epic 4: Accessibility 测试基线

**工时**: 3h | **优先级**: P2 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E4-S1 | axe-core 集成 | 1h | Playwright + axe-core 配置完成 |
| E4-S2 | 核心页面 Accessibility 检查 | 1h | Homepage/Canvas/Export 无 Critical/Serious 违规 |
| E4-S3 | CI Accessibility 测试 | 1h | axe 测试 CI blocking，报告输出到 `reports/a11y/` |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | axe-core 配置 | Playwright + `@axe-core/playwright` 集成 | `expect(axeConfig.exists).toBe(true)` | ❌ |
| F4.2 | Homepage 违规检查 | axe 扫描无 Critical/Serious | `expect(criticalViolations).toBe(0)` | ❌ |
| F4.3 | Canvas 违规检查 | axe 扫描无 Critical/Serious | `expect(criticalViolations).toBe(0)` | ❌ |
| F4.4 | Export 违规检查 | axe 扫描无 Critical/Serious | `expect(criticalViolations).toBe(0)` | ❌ |
| F4.5 | CI blocking | axe 测试失败时 CI 状态为 failure | `expect(ciStatus).toBe('failure')` | ❌ |

#### DoD

- [ ] axe-core 在 Playwright 中可用
- [ ] 核心页面（Homepage/Canvas/Export）无 Critical/Serious 违规
- [ ] `tests/a11y/` 测试文件存在且 CI blocking
- [ ] accessibility 报告输出到 `reports/a11y/`

---

### Epic 5: Svelte Framework 导出

**工时**: 4h | **优先级**: P2 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E5-S1 | React2Svelte 映射表 | 2h | Button/Input/Card 组件映射 |
| E5-S2 | 导出面板三框架切换 | 1h | React/Vue/Svelte RadioGroup |
| E5-S3 | Svelte 运行验证 | 1h | Button/Input/Card 在 Svelte 下可运行 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | Svelte 映射表 | `components/react2svelte/mappings.ts` | `expect(mappings.Button).toBeDefined()` | ❌ |
| F5.2 | 三框架切换 | 导出面板 RadioGroup（React/Vue/Svelte） | `expect(isVisible(toggle)).toBe(true)` | 【需页面集成】 |
| F5.3 | Svelte 组件生成 | `.svelte` 单文件组件输出 | `expect(output.includes('<script>')).toBe(true)` | ❌ |
| F5.4 | Svelte E2E 验证 | Button/Input/Card 在 Svelte 下渲染 | `expect(svelteComponentsRender).toBe(true)` | ❌ |
| F5.5 | 测试覆盖率 | 映射表 + 生成器覆盖率 ≥ 80% | `expect(coverage).toBeGreaterThanOrEqual(80)` | ❌ |

#### DoD

- [ ] 导出面板支持 React/Vue/Svelte 三框架切换
- [ ] Button/Input/Card 在 Svelte 下 E2E 测试通过
- [ ] 测试覆盖率 ≥ 80%
- [ ] reviewer 两阶段审查通过

---

## 3. 验收标准（汇总）

| Epic | Story | expect() 断言 |
|------|-------|--------------|
| E1 | E1-S1 | `expect(dupCount).toBe(0)` |
| E1 | E1-S2 | `expect(isDefaultExport(AppErrorBoundary)).toBe(true)` |
| E1 | E1-S2 | `expect(errorBoundaryCount).toBe(1)` |
| E2 | E2-S1 | `expect(ghostTaskCount).toBe(0)` |
| E2 | E2-S2 | `expect(fakeDoneCount).toBe(0)` |
| E2 | E2-S2 | `expect(cliExitCode).toBe(0)` |
| E2 | E2-S3 | `expect(hookInstallSuccess).toBe(true)` |
| E3 | E3-S1 | `expect(undoSteps >= 1).toBe(true)` |
| E3 | E3-S2 | `expect(redoSteps >= 1).toBe(true)` |
| E3 | E3-S2 | `expect(isVisible(undoBar)).toBe(true)` |
| E3 | E3-S3 | `expect(stackLength).toBeLessThanOrEqual(50)` |
| E4 | E4-S1 | `expect(axeConfig.exists).toBe(true)` |
| E4 | E4-S2/3/4 | `expect(criticalViolations).toBe(0)` |
| E4 | E4-S5 | `expect(ciStatus).toBe('failure')` |
| E5 | E5-S1 | `expect(mappings.Button).toBeDefined()` |
| E5 | E5-S2 | `expect(isVisible(toggle)).toBe(true)` |
| E5 | E5-S3 | `expect(output.includes('<script>')).toBe(true)` |
| E5 | E5-S4 | `expect(svelteComponentsRender).toBe(true)` |
| E5 | E5-S5 | `expect(coverage).toBeGreaterThanOrEqual(80)` |

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
| E1 | 通知重复率 0 + ErrorBoundary 统一为 1 个组件 |
| E2 | changelog-gen CLI 生成有效 CHANGELOG + git hook 安装成功 |
| E3 | Ctrl+Z/Y 快捷键 + UndoBar + 50 步限制 |
| E4 | axe Critical/Serious 违规 0 条 + CI blocking |
| E5 | 三框架切换 + Svelte E2E 通过 + 覆盖率 ≥ 80% |

---

## 5. 优先级矩阵

| 优先级 | Epic | 建议排期 |
|--------|------|----------|
| P0 | E1 | Sprint 3（第 1 天） |
| P1 | E2, E3 | Sprint 3（第 1-3 天） |
| P2 | E4, E5 | Sprint 3（第 3-5 天） |

### Sprint 3 排期建议

```
Sprint 3（本周，E1-E5 并行）:
  - Dev: E1（4h，dedup + ErrorBoundary）
  - Dev: E2（4h，heartbeat + changelog）
  - Dev: E3（5h，Undo/Redo，依赖 ShortcutBar）
  - Dev: E4（3h，Accessibility）
  - Dev: E5（4h，Svelte 导出）
  → 总计 20h，约 1 周完成
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| **性能** | changelog-gen 处理 1000 commits < 5s |
| **可靠性** | 通知去重 100% 准确（5min 窗口） |
| **可维护性** | Undo/Redo 历史栈统一管理，不散落在各组件 |
| **可访问性** | WCAG 2.1 AA 合规（Critical/Serious 违规 0 条） |
| **兼容性** | Svelte 导出覆盖 Svelte 4 语法 |

---

## 7. 依赖关系图

```
E1 ─┐
E2 ─┼─→ Sprint 3（E1-E2 可立即并行）
     │
E3 ──→ Sprint 3（第 1-3 天，依赖 ShortcutBar 已存在）
E4 ─┐
E5 ─┴─→ Sprint 3（第 3-5 天，并行）
```

---

## 8. 风险跟踪

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| changelog-gen commit format 不规范 | 低 | 中 | 先建立 commit-msg hook 校验 |
| Svelte 映射质量差 | 中 | 中 | MVP 仅 Button/Input/Card |
| Undo/Redo 与 Zustand migration 冲突 | 低 | 高 | E2 的 migration 库已隔离 |
| axe 误报导致 CI 不稳定 | 低 | 低 | 仅 Critical/Serious blocking |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 11:16 GMT+8*
