# PRD: proposals-20260401-9 — Sprint 3 规划

**Agent**: PM
**日期**: 2026-04-02
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

Sprint 2 完成 E1（E2E稳定）、E2（RN/WebP导出）、E3（技术债清理）。Sprint 3 聚焦：Canvas Checkbox 统一修复、画布消息抽屉 Phase1、响应式布局、快捷键全覆盖。

### 目标

Sprint 3 完成 4 个 Epic，提升 Canvas 核心体验。总工时 ~20-27h。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| E1 Checkbox 修复 | 双向切换 + Flow 联动 | E2E 测试 |
| E2 抽屉 Phase1 | 命令可触发 + 日志可查 | Playwright |
| E3 响应式 | 768px/375px 断点测试 | Playwright |
| E4 快捷键 | Ctrl+Shift+C/G 可用 | Playwright |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 工时 | 优先级 | 产出文件 |
|------|------|------|--------|----------|
| E1 | Canvas Checkbox 统一修复 | 4-6h | P0 | specs/e1-checkbox-fix.md |
| E2 | 画布消息抽屉 Phase1 | 8-10h | P0 | specs/e2-msg-drawer.md |
| E3 | 响应式布局与移动端体验 | 5-7h | P1 | specs/e3-responsive.md |
| E4 | 键盘快捷键全覆盖 | 3-4h | P1 | specs/e4-shortcuts.md |

**总工时**: 20-27h

---

### Epic 1: Canvas Checkbox 统一修复

**工时**: 4-6h | **优先级**: P0 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | confirmContextNode 双向切换 | confirmed 状态支持 true↔false 切换 | `expect(confirmed).toBe(false)` | 【需页面集成】 |
| F1.2 | FlowCard 勾选联动 | FlowCard 勾选后子步骤同步 confirmed 状态 | `expect(subStepsConfirmed).toBe(true)` | 【需页面集成】 |
| F1.3 | CardTreeNode checkbox 传递 | onToggleSelect 传递给 CardTreeNode | `expect(checkboxWorks).toBe(true)` | 【需页面集成】 |

#### DoD

- [ ] confirmContextNode 支持双向切换
- [ ] FlowCard 勾选后子步骤联动
- [ ] CardTreeNode checkbox 可点击

---

### Epic 2: 画布消息抽屉 Phase1

**工时**: 8-10h | **优先级**: P0 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | Chat 风格抽屉 | Slack 风格 200px 宽度抽屉 | `expect(drawerWidth).toBe(200)` | 【需页面集成】 |
| F2.2 | /submit 命令 | 输入 `/submit` 触发画布提交事件 | `expect(eventTriggered).toBe(true)` | 【需页面集成】 |
| F2.3 | 节点关联命令过滤 | 点选卡片后过滤可用命令范围 | `expect(filteredCmds.length).toBeLessThan(allCmds.length)` | 【需页面集成】 |
| F2.4 | 控制台日志 | 输出调用事件（非 API 路由） | `expect(logVisible).toBe(true)` | 【需页面集成】 |

#### DoD

- [ ] 抽屉可打开/关闭
- [ ] `/submit` 命令可触发事件
- [ ] 点选卡片后命令过滤正确
- [ ] 控制台日志正常显示

---

### Epic 3: 响应式布局与移动端体验

**工时**: 5-7h | **优先级**: P1 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 768px 断点 | ≥768px 两列布局（树+画布），抽屉 overlay | `expect(layoutCols).toBe(2)` | 【需页面集成】 |
| F3.2 | 375px 断点 | <768px 单列，Tab 切换三视图 | `expect(layoutCols).toBe(1)` | 【需页面集成】 |
| F3.3 | 抽屉 overlay | 移动端抽屉 overlay 不遮挡画布主体 | `expect(overlayWorks).toBe(true)` | 【需页面集成】 |

#### DoD

- [ ] 768px 断点下画布可正常操作
- [ ] 移动端 Tab 切换三视图可用
- [ ] 抽屉 overlay 不遮挡画布

---

### Epic 4: 键盘快捷键全覆盖

**工时**: 3-4h | **优先级**: P1 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | Ctrl+Shift+C | 触发卡片确认 | `expect(cardConfirmed).toBe(true)` | 【需页面集成】 |
| F4.2 | Ctrl+Shift+G | 触发上下文生成 | `expect(contextGenerated).toBe(true)` | 【需页面集成】 |
| F4.3 | / 唤起命令面板 | `/` 唤起命令面板（与 E2 抽屉集成） | `expect(panelVisible).toBe(true)` | 【需页面集成】 |

#### DoD

- [ ] Ctrl+Shift+C/G 功能正常
- [ ] `/` 唤起命令面板
- [ ] ShortcutHintPanel 更新说明

---

## 3. 验收标准（汇总）

| Epic | expect() 断言 |
|------|--------------|
| E1 | `expect(confirmed).toBe(false)` |
| E1 | `expect(subStepsConfirmed).toBe(true)` |
| E2 | `expect(eventTriggered).toBe(true)` |
| E2 | `expect(filteredCmds.length).toBeLessThan(allCmds.length)` |
| E3 | `expect(layoutCols).toBe(2)` |
| E4 | `expect(cardConfirmed).toBe(true)` |

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
| E1 | confirmContextNode 双向 + Flow 联动 + checkbox 可点击 |
| E2 | /submit 触发 + 命令过滤 + 日志正常 |
| E3 | 768px/375px 断点通过 + overlay 不遮挡 |
| E4 | Ctrl+Shift+C/G 可用 + / 唤起面板 |

---

## 5. Sprint 3 排期

```
Sprint 3（第 1-3 天）:
  E1（P0，4-6h）→ 立即启动
  E2（P0，8-10h）→ E1 完成后
  E3（P1，5-7h）→ 与 E1/E2 并行
  E4（P1，3-4h）→ 与 E1/E2 并行
  → 总计 20-27h，约 2-3 天完成
```

---

*PRD 版本: v1.0 | 生成时间: 2026-04-02 02:16 GMT+8*
