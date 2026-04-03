# PRD: proposals-20260401-5 — 收尾 + 扩展

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

Batches 1-4 核心 Epics 全部完成（20 Epic），剩余 2 个遗留未认领项 + 3 个新发现机会。本批次聚焦：DDD 命名规范、v0 竞品监控、Tab 快捷键、Domain CI 检查、多格式导出。

### 目标

完成遗留项 + 新功能扩展，建立持续改进机制。总工时 7h。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| DDD 规范覆盖 | 100% 常见场景 | 文档包含允许/禁止模式 |
| v0 监控 | 周会回顾 | agenda 包含 v0 更新 |
| Tab 快捷键 | Alt+1/2/3 响应 | E2E 快捷键测试 |
| Domain CI | 30 天更新检查 | CI workflow 验证 |
| 导出格式 | PNG/SVG 批量 | 导出文件验证 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 工时 | 优先级 | 产出文件 |
|------|------|------|--------|----------|
| E1 | DDD 命名规范 + Tab 快捷键 | 3h | P1 | specs/e1-ddd-naming-tab.md |
| E2 | v0 监控 + Domain CI 检查 | 2h | P1 | specs/e2-v0-monitor-ci.md |
| E3 | PNG/SVG 批量导出 | 2h | P2 | specs/e3-multi-format-export.md |

**总工时**: 7h

---

### Epic 1: DDD 命名规范 + Tab 快捷键

**工时**: 3h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E1-S1 | DDD 命名规范文档 | 2h | docs/ddd-naming-convention.md 存在 |
| E1-S2 | Tab 快捷键绑定 | 1h | Alt+1/2/3 切换 activeTree |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | DDD 命名文档 | docs/ddd-naming-convention.md 含允许/禁止模式 | `expect(docExists).toBe(true)` | ❌ |
| F1.2 | 允许模式 | 文档包含患者档案、订单处理等有效 DDD 术语 | `expect(validPatterns.includes('患者档案')).toBe(true)` | ❌ |
| F1.3 | 禁止模式 | 文档包含 xxx管理、xxx系统等通用后缀 | `expect(forbiddenPatterns.includes('管理')).toBe(true)` | ❌ |
| F1.4 | Alt+1 切换 | Alt+1 切换到 Context 面板 | `expect(activeTree).toBe('context')` | 【需页面集成】 |
| F1.5 | Alt+2 切换 | Alt+2 切换到 Flow 面板 | `expect(activeTree).toBe('flow')` | 【需页面集成】 |
| F1.6 | Alt+3 切换 | Alt+3 切换到 Component 面板 | `expect(activeTree).toBe('component')` | 【需页面集成】 |
| F1.7 | ShortcutHint 更新 | ShortcutHintPanel 显示 Alt+1/2/3 说明 | `expect(hintText).toContain('Alt+1')` | 【需页面集成】 |

#### DoD

- [ ] ddd-naming-convention.md 文档存在
- [ ] 包含允许模式（≥ 5）和禁止模式（≥ 5）
- [ ] Alt+1/2/3 可切换 Tab
- [ ] ShortcutHintPanel 更新

---

### Epic 2: v0 监控 + Domain CI 检查

**工时**: 2h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E2-S1 | v0 竞品周会机制 | 0.5h | 周会议程包含 v0 更新 |
| E2-S2 | Domain CI 检查 | 1.5h | CI 检查 domain.md 更新时间 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | v0 周会议程 | 周会 agenda 模板包含 v0 更新项 | `expect(agendaTemplate.includes('v0')).toBe(true)` | ❌ |
| F2.2 | v0 更新记录 | docs/competitive/v0-updates.md 存在 | `expect(v0UpdatesDoc.exists).toBe(true)` | ❌ |
| F2.3 | Domain CI workflow | .github/workflows/domain-check.yml 存在 | `expect(ciWorkflow.exists).toBe(true)` | ❌ |
| F2.4 | 30 天检查 | domain.md 超过 30 天未更新 CI warn | `expect(warnOnStale).toBe(true)` | ❌ |

#### DoD

- [ ] 周会议程包含 v0 更新
- [ ] v0-updates.md 文档存在
- [ ] Domain CI workflow 存在且可执行

---

### Epic 3: PNG/SVG 批量导出

**工时**: 2h | **优先级**: P2 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E3-S1 | 导出面板增强 | 1h | 面板增加 PNG/SVG 选项 |
| E3-S2 | 批量导出到 zip | 1h | 所有节点导出为 zip |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | PNG 导出选项 | 导出面板增加「导出为 PNG」 | `expect(exportOptions.includes('PNG')).toBe(true)` | 【需页面集成】 |
| F3.2 | SVG 导出选项 | 导出面板增加「导出为 SVG」 | `expect(exportOptions.includes('SVG')).toBe(true)` | 【需页面集成】 |
| F3.3 | 批量导出 | 全部节点导出到单个 zip | `expect(zipFile.exists).toBe(true)` | 【需页面集成】 |
| F3.4 | 导出完整性 | zip 包含所有节点图片 | `expect(nodeCountInZip).toEqual(totalNodes)` | ❌ |

#### DoD

- [ ] 导出面板支持 PNG/SVG 选择
- [ ] 批量导出到 zip 功能可用
- [ ] Playwright E2E 覆盖导出场景

---

## 3. 验收标准（汇总）

| Epic | Story | expect() 断言 |
|------|-------|--------------|
| E1 | F1.1 | `expect(docExists).toBe(true)` |
| E1 | F1.2/3 | `expect(validPatterns.length >= 5)` |
| E1 | F1.4/5/6 | `expect(activeTree === 'context\|flow\|component')` |
| E2 | F2.1 | `expect(agendaTemplate.includes('v0')).toBe(true)` |
| E2 | F2.3 | `expect(ciWorkflow.exists).toBe(true)` |
| E3 | F3.1/2 | `expect(exportOptions.includes('PNG')).toBe(true)` |
| E3 | F3.4 | `expect(nodeCountInZip).toEqual(totalNodes)` |

---

## 4. DoD

### 全局 DoD

1. **DDD 规范**: 文档存在且覆盖 ≥ 10 个场景
2. **v0 监控**: 周会机制建立
3. **Tab 快捷键**: Alt+1/2/3 工作正常
4. **Domain CI**: 30 天检查可执行
5. **导出增强**: PNG/SVG 批量导出可用

### 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | DDD 文档 + Tab 快捷键全部可用 |
| E2 | v0 周会 + Domain CI workflow 存在 |
| E3 | 导出面板增强 + zip 导出可用 |

---

## 5. 优先级矩阵

| 优先级 | Epic | 排期 |
|--------|------|------|
| P1 | E1, E2 | Sprint 5（第 1 天） |
| P2 | E3 | Sprint 5（第 2 天） |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 17:11 GMT+8*
