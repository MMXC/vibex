# PRD: VibeX 路线图 2026-03-30

> **任务**: vibex-roadmap-20260330/create-prd  
> **创建日期**: 2026-03-30  
> **PM**: PM Agent  
> **项目路径**: /root/.openclaw/vibex  
> **产出物**: /root/.openclaw/vibex/docs/vibex-roadmap-20260330/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | gstack QA 验证发现多个 P0/P1 bug，汇总为三阶段路线图 |
| **目标** | Bug Fix Sprint → Phase2 完成 → 基础设施 |
| **成功指标** | Phase 0 完成，npm test 100%，gstack QA 通过 |

---

## 2. Phase 概览

| Phase | 名称 | 优先级 | 工时 |
|-------|------|--------|------|
| Phase 0 | Bug Fix Sprint | P0 | ~21h |
| Phase 1 | Phase2 功能完成 | P1 | ~9h |
| Phase 2 | 基础设施 | P1 | ~10h |

---

## 3. Phase 0: Bug Fix Sprint

### 3.1 Bug 清单

| Bug | 根因 | 预计工时 |
|-----|------|---------|
| B1: 继续·流程树按钮 disabled | `disabled={allConfirmed}` | 1h |
| Checkbox 双重渲染 | selection + confirmation checkbox 共存 | 6h |
| BC 树连线堆叠 | flex column 布局 dx=0 | 6h |
| 组件树分类错误 | AI 生成 flowId='common' | 6h |
| OverlapHighlightLayer 未导入 | 缺少 import | 2h |

### 3.2 功能需求

#### F1: B1 - 按钮禁用逻辑修复

**描述**：移除 `disabled={allConfirmed}`

**验收标准**：
```
expect(continueButton.disabled).toBe(false);
expect(clickContinueButton).toNavigateToFlowTree();
```

#### F2: Checkbox 去重

**描述**：移除 selection checkbox，保留确认 checkbox

**验收标准**：
```
expect(document.querySelectorAll('[type="checkbox"]').length).toBe(1);
```

#### F3: BC 树连线布局修复

**描述**：CSS 改为水平布局

**验收标准**：
```
expect(flexDirection).not.toBe('column');
expect(edgeLines).toBeHorizontal();
```

#### F4: 组件树分类修复

**描述**：修复 AI flowId 填充

**验收标准**：
```
expect(flowId).toMatch(flowNodes.nodeId);
expect(pageLabels).not.toContain('未知页面');
```

#### F5: OverlapHighlightLayer 集成

**描述**：导入并渲染组件

**验收标准**：
```
expect(OverlapHighlightLayer).toBeImported();
expect(OverlapHighlightLayer).toBeRendered();
```

### 3.3 Epic 拆分

#### Epic 1: B1 按钮修复（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S1.1 | 移除 disabled=allConfirmed | 0.5h |
| S1.2 | 验证可点击跳转 | 0.5h |

#### Epic 2: Checkbox 去重（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S2.1 | 移除 selection checkbox | 2h |
| S2.2 | 确认 checkbox 位置调整 | 2h |
| S2.3 | 验证交互 | 1h |

#### Epic 3: BC 树连线修复（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S3.1 | 修改 CSS 布局 | 3h |
| S3.2 | 验证连线水平 | 2h |

#### Epic 4: 组件树分类修复（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S4.1 | 修复 AI flowId | 3h |
| S4.2 | 验证分类正确 | 2h |

#### Epic 5: OverlapHighlightLayer 集成（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S5.1 | 导入组件 | 1h |
| S5.2 | 验证渲染 | 1h |

---

## 4. Phase 1: Phase2 功能完成

### 4.1 功能需求

#### F6: expand-both 模式

**描述**：三栏并排展示

**验收标准**：
```
expect(panels).toHaveCount(3);
expect(panelLayout).toBe('horizontal');
```

#### F7: maximize 模式

**描述**：全屏 + F11/ESC 快捷键

**验收标准**：
```
expect(keyF11).toToggleFullscreen();
expect(keyEsc).toExitFullscreen();
```

#### F8: 交集高亮

**描述**：组件节点交集时高亮

**验收标准**：
```
expect(overlappingNodes).toHaveHighlight();
```

#### F9: 起止节点标记

**描述**：◉ / ◎ 视觉标记

**验收标准**：
```
expect(startNode).toHaveMarker('start');
expect(endNode).toHaveMarker('end');
```

### 4.2 Epic 拆分

#### Epic 6: 全屏模式（P1）

| Story | 描述 | 工时 |
|-------|------|------|
| S6.1 | expand-both 实现 | 2h |
| S6.2 | maximize 实现 | 2h |
| S6.3 | 快捷键绑定 | 1h |

#### Epic 7: 高亮与标记（P1）

| Story | 描述 | 工时 |
|-------|------|------|
| S7.1 | 交集高亮 | 3h |
| S7.2 | 起止标记 | 2h |

---

## 5. Phase 2: 基础设施

### 5.1 功能需求

#### F10: task_manager curl 通知

**描述**：Slack 自动通知

**验收标准**：
```
expect(phase1_notify).toBeCalled();
expect(update_done_notify).toBeCalled();
expect(curl_fail_no_block).toBe(true);
```

#### F11: 提案收集自动化

**描述**：每日提案汇总

**验收标准**：
```
expect(daily_proposal_script).toExist();
expect(proposals_YYYYMMDD).toBeGenerated();
```

### 5.2 Epic 拆分

#### Epic 8: 通知基础设施（P1）

| Story | 描述 | 工时 |
|-------|------|------|
| S8.1 | curl 通知模块 | 3h |
| S8.2 | 命令集成 | 3h |

#### Epic 9: 提案自动化（P2）

| Story | 描述 | 工时 |
|-------|------|------|
| S9.1 | 每日汇总脚本 | 2h |
| S9.2 | 定时任务 | 1h |

---

## 6. 优先级矩阵

| Phase | Impact | Effort | Score | 推荐 |
|-------|--------|--------|-------|------|
| Phase 0 Bug Fix | 🔴 极高 | 中 | ★★★★★ | **立即开始** |
| Phase 1 Phase2 | 🟡 高 | 中 | ★★★★☆ | Bug fix 后 |
| Phase 2 基础设施 | 🟢 中 | 中 | ★★★☆☆ | 并行进行 |

---

## 7. 快速验证清单

```bash
# B1
grep -n "disabled={allConfirmed}" BoundedContextTree.tsx

# Checkbox
grep -n "selectionCheckbox" BoundedContextTree.tsx

# BC Edge
grep -n "flex-direction.*column" canvas.module.css

# 组件树
grep -rn "未知页面" ComponentTree.tsx
```

---

## 8. DoD (Definition of Done)

### Phase 0 DoD
- [ ] 所有 5 个 Bug 已修复
- [ ] gstack QA 通过
- [ ] npm test 100%
- [ ] git commit + PR

### Phase 1 DoD
- [ ] expand-both/maximize 可切换
- [ ] 交集高亮显示
- [ ] 起止节点有标记

### Phase 2 DoD
- [ ] curl 通知已集成
- [ ] 提案自动汇总

---

## 9. 关联文档

- 详细分析：`docs/vibex-next-roadmap-20260330/analysis.md`
- Bug 分析：`docs/vibex-canvas-continu/bug-analysis.md`
- 提案汇总：`docs/proposal-collection-20260330/analysis.md`
