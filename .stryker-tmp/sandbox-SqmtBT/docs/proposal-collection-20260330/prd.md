# PRD: 提案收集 — 为下一轮开发做准备

> **任务**: proposal-collection-20260330/create-prd  
> **创建日期**: 2026-03-30  
> **PM**: PM Agent  
> **项目路径**: /root/.openclaw/vibex  
> **产出物**: /root/.openclaw/vibex/docs/proposal-collection-20260330/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | 汇总今日分析任务中发现的问题和改进机会，形成下一轮开发优先提案 |
| **目标** | 明确 3 个提案的范围、工时、验收标准，为 Sprint 规划提供依据 |
| **成功指标** | 完成提案 1（B星级 Sprint）Bug 修复，消除 product-blocking 问题 |

---

## 2. 提案概览

| 提案 | 优先级 | 工时 | 状态 |
|------|--------|------|------|
| 提案 1: Canvas Bug Sprint | P0 | ~15-20h | 建议优先 |
| 提案 2: Task Manager 通知基础设施 | P1 | 7h | 并行 |
| 提案 3: Canvas Phase2 全屏展开 | P1 | 8h | 依赖 Phase1 |

**决策**：先完成提案 1，再推进提案 2/3

---

## 3. 提案 1: Canvas Bug Sprint

### 3.1 Bug 清单

| Bug | 描述 | 根因 |
|-----|------|------|
| B1 | `disabled={allConfirmed}` 阻塞 `handleConfirmAll()` | 确认逻辑错误 |
| B2.1 | `OverlapHighlightLayer` 存在但未导入 | 组件未集成 |
| B2.2 | 起止节点标记代码不存在 | 功能缺失 |
| Checkbox | 卡片双重 checkbox 混乱 | UI 交互问题 |
| BC Edge | BC 树连线全部堆叠在垂直线上 | CSS 布局问题 |
| Component Tree | 组件树"未知页面"/"通用组件"错误分类 | AI flowId 填充问题 |

### 3.2 功能需求

#### F1: B1 - disabled 逻辑修复

**描述**：移除/修改 `disabled={allConfirmed}`，使 `handleConfirmAll()` 可正常点击

**验收标准**：
```
expect(disabled).toBe(false) when allConfirmed === true;
expect(handleConfirmAll).toBeCallable();
```

#### F2: B2.1 - OverlapHighlightLayer 集成

**描述**：在 CardTreeRenderer 中导入并渲染 OverlapHighlightLayer

**验收标准**：
```
expect(OverlapHighlightLayer).toBeImported();
expect(OverlapHighlightLayer).toBeInTheDocument();
```

#### F3: B2.2 - 起止节点标记

**描述**：实现起止节点的特殊视觉标记

**验收标准**：
```
expect(startNode).toHaveVisualMarker('start');
expect(endNode).toHaveVisualMarker('end');
```

#### F4: Checkbox 去重

**描述**：移除 selection checkbox，保留确认 checkbox

**验收标准**：
```
expect(document.querySelectorAll('[type="checkbox"]').length).toBe(1);
expect(checkboxPosition).toBeBefore(description);
```

#### F5: BC 树连线布局修复

**描述**：CSS 改为水平/网格布局，修复连线堆叠问题

**验收标准**：
```
expect(flexDirection).not.toBe('column');
expect(edges).not.toBeStackedVertically();
```

#### F6: 组件树分类修复

**描述**：修复 AI 生成阶段 flowId 填充逻辑

**验收标准**：
```
expect(flowId).toMatch(flowNodes.nodeId);
expect(pageLabels).not.toContain('未知页面');
```

### 3.3 Epic 拆分

#### Epic 1: 确认逻辑修复（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S1.1 | 移除 disabled=allConfirmed 限制 | 1h |
| S1.2 | 验证 handleConfirmAll 可点击跳转 | 0.5h |

#### Epic 2: 组件集成（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S2.1 | OverlapHighlightLayer 导入 | 1h |
| S2.2 | 起止节点标记实现 | 2h |

#### Epic 3: UI 修复（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S3.1 | Checkbox 去重 | 2h |
| S3.2 | BC 树连线布局 | 2h |
| S3.3 | 组件树分类修复 | 3h |

#### Epic 4: 验证（P1）

| Story | 描述 | 工时 |
|-------|------|------|
| S4.1 | gstack 截图验证 | 2h |
| S4.2 | 快速验收单检查 | 1h |

---

## 4. 提案 2: Task Manager 通知基础设施

### 4.1 功能需求

#### F7: phase1/phase2 执行后通知

**描述**：创建任务链后自动通知首个 agent

**验收标准**：
```
expect(curl_called).toBe(true);
expect(curl_payload.channel).toBe(AGENT_CHANNEL[agent]);
expect(curl_payload.text).toContain('新任务 READY');
```

#### F8: update done 通知下一环节

**描述**：任务完成后自动通知依赖方

**验收标准**：
```
expect(curl_called).toBe(true);
expect(curl_payload.text).toContain('任务完成');
expect(curl_payload.text).toContain('轮到你了');
```

#### F9: update pending 驳回通知

**描述**：任务驳回时通知原 agent

**验收标准**：
```
expect(curl_payload.text).toContain('任务被驳回');
expect(curl_payload.text).toContain(reason);
```

#### F10: curl 失败处理

**描述**：curl 失败不阻塞主流程

**验收标准**：
```
expect(command_status).toBe(0);
expect(stderr).toContain('⚠️ 通知发送失败');
```

### 4.2 Epic 拆分

#### Epic 5: 通知模块开发（P1）

| Story | 描述 | 工时 |
|-------|------|------|
| S5.1 | 新增 _curl_slack 函数 | 1h |
| S5.2 | 新增 notify_* 函数 | 2h |
| S5.3 | 集成 phase1/phase2 | 2h |
| S5.4 | 集成 update done/pending | 2h |

---

## 5. 提案 3: Canvas Phase2 全屏展开

### 5.1 功能需求

#### F11: expand-both 模式

**描述**：三栏同时展开的全屏模式

**验收标准**：
```
expect(leftPanel).toBeExpanded();
expect(centerPanel).toBeExpanded();
expect(rightPanel).toBeExpanded();
expect(localStorage).toHaveProperty('expandMode', 'expand-both');
```

#### F12: maximize 模式

**描述**：工具栏隐藏的真正全屏

**验收标准**：
```
expect(toolbar).not.toBeVisible();
expect(fullscreen).toBe(true);
expect(keyF11).toToggleFullscreen();
expect(keyEsc).toExitFullscreen();
```

#### F13: 状态持久化

**描述**：全屏状态保存到 localStorage

**验收标准**：
```
expect(localStorage.getItem('expandMode')).toBe('expand-both');
expect(pageReload).toRestoreExpandMode();
```

### 5.2 Epic 拆分

#### Epic 6: 全屏展开（P1）

| Story | 描述 | 工时 |
|-------|------|------|
| S6.1 | expand-both 模式实现 | 3h |
| S6.2 | maximize 模式实现 | 2h |
| S6.3 | 快捷键绑定 F11/ESC | 1h |
| S6.4 | localStorage 持久化 | 1h |
| S6.5 | gstack 验证 | 1h |

---

## 6. 优先级矩阵

| 提案/功能 | 价值 | 成本 | 优先级 |
|-----------|------|------|--------|
| 提案 1 Bug Sprint | 极高 | 中 | P0 |
| 提案 2 Task Manager | 高 | 低 | P1 |
| 提案 3 全屏展开 | 中 | 中 | P1 |

---

## 7. 快速验收单（提案 1 必检）

```bash
# B1 修复
grep -n "disabled={allConfirmed}" BoundedContextTree.tsx

# B2.1 导入
grep -n "OverlapHighlightLayer" CardTreeRenderer.tsx

# Checkbox 去重
grep -n "selectionCheckbox" BoundedContextTree.tsx

# BC Edge 布局
grep -n "flex-direction.*column" canvas.module.css

# 组件树分类
grep -rn "未知页面" ComponentTree.tsx
```

---

## 8. 非功能需求

| 需求 | 要求 |
|------|------|
| 性能 | gstack 验证响应 < 2s |
| 兼容性 | 快捷键不与浏览器冲突 |
| 可测试性 | 每个 Story 有单元测试 |

---

## 9. DoD (Definition of Done)

### 提案 1 DoD
- [ ] 所有 6 个 Bug 已修复
- [ ] gstack 截图验证通过
- [ ] 快速验收单全部通过
- [ ] npm test 100% 通过
- [ ] git commit + PR

### 提案 2 DoD
- [ ] curl 通知已集成到 phase1/phase2/update
- [ ] curl 失败不影响主流程
- [ ] 独立脚本测试通过

### 提案 3 DoD
- [ ] expand-both 和 maximize 模式可切换
- [ ] F11/ESC 快捷键正常
- [ ] localStorage 持久化正常

---

## 10. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 提案 1 Bug 相互关联 | 先独立修复，独立验证，再集成 |
| 提案 3 依赖 Phase1 | Phase1 完成后开启提案 3 |
| gstack 验证不稳定 | 添加重试机制 |
