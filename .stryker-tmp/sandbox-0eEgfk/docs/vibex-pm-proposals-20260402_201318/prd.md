# PRD: VibeX PM 提案 PRD — vibex-pm-proposals-20260402_201318

**项目**: vibex-pm-proposals-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
从 PM 视角识别 6 项体验改进，涵盖确认状态可视化、面板持久化、导出向导、空状态引导、移动端降级、PRD 导出。

### 目标
提升用户确定性、减少认知负担、扩大适用范围。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| 确认状态可视化 | ❌ 不清晰 | ✅ 绿色=已确认/黄色=待确认 |
| 面板状态持久化 | ❌ 不保留 | ✅ 刷新后保持 |
| 导出成功率 | 未知 | ≥95% |

---

## Epic 拆分

### Epic 1: 确认状态可视化
**工时**: 2h | **优先级**: P0 | **依赖**: D-E1, D-E2

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 未确认黄色边框 | 0.5h | expect(borderColor).toBe('yellow') |
| E1-S2 | 已确认绿色边框 | 0.5h | expect(borderColor).toBe('green') |
| E1-S3 | 状态筛选快捷操作 | 1h | expect(filterWorks).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 未确认边框 | 未确认节点黄色虚线边框 | expect(yellowBorder).toBe(true) | ✅ |
| F1.2 | 已确认边框 | 已确认节点绿色实线边框 | expect(greenBorder).toBe(true) | ✅ |
| F1.3 | 筛选快捷操作 | 工具栏筛选 confirmed/pending | expect(filterWorks).toBe(true) | ✅ |
| F1.4 | 导出提示 | 导出弹窗提示"未确认将被忽略" | expect(exportWarning).toBe(true) | ✅ |

---

### Epic 2: 面板状态持久化
**工时**: 1h | **优先级**: P0 | **依赖**: 无

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | localStorage 存储 | 0.5h | expect(localStorageKey).toBeDefined() |
| E2-S2 | 状态恢复 | 0.5h | expect(stateRestored).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 面板状态存储 | 展开/折叠状态存 localStorage | expect(panelStateSaved).toBe(true) | ✅ |
| F2.2 | 状态恢复 | 刷新后状态恢复 | expect(stateRestored).toBe(true) | ✅ |
| F2.3 | 首次默认展开 | 首次访问默认全部展开 | expect(defaultExpanded).toBe(true) | ✅ |

---

### Epic 3: 导出向导
**工时**: 3h | **优先级**: P1 | **依赖**: D-003 canvasStore 拆分

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | 向导 UI | 1.5h | expect(wizardSteps).toBe(3) |
| E3-S2 | 必填项标记 | 0.5h | expect(requiredMarked).toBe(true) |
| E3-S3 | 进度条 | 0.5h | expect(progressBar).toBe(true) |
| E3-S4 | 成功/失败反馈 | 0.5h | expect(feedbackShown).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 导出向导 | Step 1/2/3 向导 | expect(wizardSteps).toBe(3) | ✅ |
| F3.2 | 必填项标记 | 红色星号标识 | expect(requiredMarked).toBe(true) | ✅ |
| F3.3 | 进度条 | 导出过程进度条 | expect(progressBar).toBe(true) | ✅ |
| F3.4 | 结果反馈 | 成功/失败明确提示 | expect(feedbackShown).toBe(true) | ✅ |

---

### Epic 4: 空状态引导
**工时**: 2h | **优先级**: P1 | **依赖**: 无

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 引导卡片 | 1h | expect(guideCard).toBe(true) |
| E4-S2 | 快捷操作 | 0.5h | expect(quickActions).toBe(true) |
| E4-S3 | 历史数据隐藏 | 0.5h | expect(guideHidden).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 空画布引导 | 引导卡片提示下一步 | expect(guideCard).toBe(true) | ✅ |
| F4.2 | 快捷操作按钮 | 引导卡片含快捷操作 | expect(quickActions).toBe(true) | ✅ |
| F4.3 | 有数据时隐藏 | 有历史数据引导卡片消失 | expect(guideHidden).toBe(true) | ✅ |

---

### Epic 5: 移动端降级
**工时**: 3h | **优先级**: P2 | **依赖**: PWA 基础设施

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E5-S1 | 设备检测 | 1h | expect(mobileDetected).toBe(true) |
| E5-S2 | 降级提示 | 1h | expect(degradedMessage).toBe(true) |
| E5-S3 | 只读预览入口 | 1h | expect(readOnlyEntry).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | 移动端检测 | 检测移动设备 | expect(mobileDetected).toBe(true) | ✅ |
| F5.2 | 友好降级提示 | 提示使用桌面浏览器 | expect(degradedMessage).toBe(true) | ✅ |
| F5.3 | 只读预览入口 | 提供查看只读预览 | expect(readOnlyEntry).toBe(true) | ✅ |

---

### Epic 6: PRD 导出
**工时**: 4h | **优先级**: P2 | **依赖**: 导出 API

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E6-S1 | Markdown 格式 | 2h | expect(markdownExport).toBe(true) |
| E6-S2 | 内容结构 | 1h | expect(contentStructure).toBe(true) |
| E6-S3 | 飞书兼容 | 1h | expect(feishuCompatible).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | Markdown 导出 | 导出选项有 Markdown 格式 | expect(markdownExport).toBe(true) | ✅ |
| F6.2 | 内容完整 | 包含上下文+流程+组件清单 | expect(contentComplete).toBe(true) | ✅ |
| F6.3 | 飞书兼容 | 可直接粘贴到飞书文档 | expect(feishuCompatible).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 | 依赖 |
|------|------|------|--------|------|
| E1 | 确认状态可视化 | 2h | P0 | D-E1, D-E2 |
| E2 | 面板状态持久化 | 1h | P0 | 无 |
| E3 | 导出向导 | 3h | P1 | D-003 |
| E4 | 空状态引导 | 2h | P1 | 无 |
| E5 | 移动端降级 | 3h | P2 | PWA |
| E6 | PRD 导出 | 4h | P2 | 导出 API |
| **总计** | | **15h** | | |

---

## Sprint 排期建议

| Sprint | Epic | 工时 | 依赖 |
|--------|------|------|------|
| Sprint 1 | E1 + E2 | 3h | D-E1, D-E2 |
| Sprint 2 | E3 | 3h | D-003 |
| Sprint 3 | E4 | 2h | 无 |
| Sprint 4 | E5 + E6 | 7h | PWA |

---

## DoD

### E1: 确认状态可视化
- [ ] 未确认节点黄色边框
- [ ] 已确认节点绿色边框
- [ ] 工具栏有状态筛选
- [ ] 导出时提示未确认将被忽略

### E2: 面板状态持久化
- [ ] localStorage 存储面板状态
- [ ] 刷新后状态恢复
- [ ] 首次访问默认展开

### E3: 导出向导
- [ ] Step 1/2/3 向导
- [ ] 必填项红色星号
- [ ] 进度条
- [ ] 成功/失败反馈

### E4: 空状态引导
- [ ] 引导卡片显示
- [ ] 含快捷操作
- [ ] 有数据时隐藏

### E5: 移动端降级
- [ ] 移动设备检测
- [ ] 友好降级提示
- [ ] 只读预览入口

### E6: PRD 导出
- [ ] Markdown 格式可选
- [ ] 内容结构完整
- [ ] 飞书兼容

---

## 验收标准（expect() 断言汇总）

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 未确认节点 | 渲染 | 黄色边框 |
| E1-AC2 | 已确认节点 | 渲染 | 绿色边框 |
| E1-AC3 | 导出弹窗 | 未确认节点 | 提示将被忽略 |
| E2-AC1 | 展开面板 | 刷新 | 状态保持 |
| E2-AC2 | localStorage | 检查 | 有面板状态 key |
| E3-AC1 | 导出按钮 | 点击 | Step 1/2/3 向导 |
| E3-AC2 | 必填项 | 渲染 | 红色星号 |
| E4-AC1 | 空画布 | 渲染 | 引导卡片 |
| E4-AC2 | 有数据 | 渲染 | 引导卡片隐藏 |
| E5-AC1 | 移动端 | 访问 | 降级提示 |
| E6-AC1 | 导出选项 | 检查 | 有 Markdown |
| E6-AC2 | 导出内容 | 检查 | 含上下文+流程+组件 |
