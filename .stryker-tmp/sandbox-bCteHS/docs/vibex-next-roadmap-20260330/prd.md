# PRD: VibeX 下一阶段路线图 — 2026-03-30

> **任务**: vibex-next-roadmap-20260330/create-prd  
> **创建日期**: 2026-03-30  
> **PM**: PM Agent  
> **项目路径**: /root/.openclaw/vibex  
> **产出物**: /root/.openclaw/vibex/docs/vibex-next-roadmap-20260330/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | gstack QA 验证发现多个 P0/P1 bug 影响核心流程，需建立分阶段路线图 |
| **目标** | 消除 product-blocking bug → 完成 Phase2 → 建立基础设施 → UX 增强 |
| **成功指标** | Phase 0 完成，npm test 100%，gstack 截图验证通过 |

---

## 2. Phase 概览

| Phase | 名称 | 优先级 | 工时 | 状态 |
|-------|------|--------|------|------|
| Phase 0 | Bug Fix Sprint | P0 | ~21h | 立即开始 |
| Phase 1 | Phase2 功能完成 | P1 | ~9h | Bug fix 后 |
| Phase 2 | 基础设施 | P1 | ~10h | 并行进行 |
| Phase 3 | UX 增强 | P2 | ~12h | V2 |

---

## 3. Phase 0: Bug Fix Sprint

### 3.1 Bug 清单

| Bug | 文件 | 根因 | 预计工时 |
|-----|------|------|---------|
| B1: 继续·流程树按钮禁用 | `BoundedContextTree.tsx:519` | `disabled={allConfirmed}` | 1h |
| Checkbox 去重 | `BoundedContextTree.tsx:233-256` | selection checkbox 与确认 checkbox 共存 | 6h |
| BC 树连线堆叠 | `canvas.module.css:809` | flex column 布局导致 dx=0 | 6h |
| 组件树分类错误 | `ComponentTree.tsx:51-53` | AI 生成 flowId='common' | 6h |
| OverlapHighlightLayer 未集成 | `CardTreeRenderer.tsx` | 缺少 import | 2h |

### 3.2 功能需求

#### F1: B1 - 按钮禁用逻辑修复

**描述**：移除 `disabled={allConfirmed}`，使按钮可点击

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
expect(checkbox).toBeBefore(description);
```

#### F3: BC 树连线布局修复

**描述**：CSS 改为水平/网格布局

**验收标准**：
```
expect(flexDirection).not.toBe('column');
expect(edgeLines).toBeHorizontal();
```

#### F4: 组件树分类修复

**描述**：修复 AI flowId 填充逻辑

**验收标准**：
```
expect(flowId).toMatch(flowNodes.nodeId);
expect(pageLabels).not.toContain('未知页面');
expect(pageLabels).not.toContain('通用组件');
```

#### F5: OverlapHighlightLayer 集成

**描述**：导入并渲染 OverlapHighlightLayer

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
| S1.2 | 验证按钮可点击跳转 | 0.5h |

#### Epic 2: Checkbox 去重（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S2.1 | 移除 selection checkbox | 2h |
| S2.2 | 确认 checkbox 移至描述前 | 2h |
| S2.3 | 验证交互正常 | 1h |

#### Epic 3: BC 树连线修复（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S3.1 | 修改 CSS 布局 | 3h |
| S3.2 | 验证连线水平展开 | 2h |

#### Epic 4: 组件树分类修复（P0）

| Story | 描述 | 工时 |
|-------|------|------|
| S4.1 | 修复 AI flowId 填充 | 3h |
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

**描述**：三栏并排展示（1fr 1fr 1fr）

**验收标准**：
```
expect(leftPanel).toHaveStyle({ flex: '1 1 0' });
expect(centerPanel).toHaveStyle({ flex: '1 1 0' });
expect(rightPanel).toHaveStyle({ flex: '1 1 0' });
```

#### F7: maximize 模式

**描述**：全屏可编辑模式 + F11/ESC 快捷键

**验收标准**：
```
expect(keyF11).toToggleFullscreen();
expect(keyEsc).toExitFullscreen();
expect(toolbar).not.toBeVisible();
```

#### F8: 交集高亮

**描述**：组件节点有交集时显示高亮

**验收标准**：
```
expect(overlappingNodes).toHaveHighlight();
```

#### F9: 起止节点标记

**描述**：起止节点有特殊视觉标记（◉ / ◎）

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
| S7.1 | 交集高亮实现 | 3h |
| S7.2 | 起止节点标记 | 2h |

---

## 5. Phase 2: 基础设施

### 5.1 功能需求

#### F10: task_manager curl 通知

**描述**：phase1/phase2/update done/pending 自动 Slack 通知

**验收标准**：
```
expect(phase1_notify).toBeCalled();
expect(update_done_notify).toBeCalled();
expect(update_pending_notify).toBeCalled();
expect(curl_fail_no_block).toBe(true);
```

#### F11: 提案收集自动化

**描述**：每日提案自动汇总

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
| S8.2 | phase1/phase2 集成 | 2h |
| S8.3 | update 集成 | 2h |

#### Epic 9: 提案自动化（P2）

| Story | 描述 | 工时 |
|-------|------|------|
| S9.1 | 每日汇总脚本 | 2h |
| S9.2 | 定时任务配置 | 1h |

---

## 6. Phase 3: UX 增强

### 6.1 功能需求

#### F12: AI 生成质量提升

**描述**：flowId 填充修复 + prompt 优化

**验收标准**：
```
expect(generated_flowId).toMatchExistingNode();
expect(generation_quality_score).toBeGreaterThan(0.8);
```

#### F13: 导出格式扩展

**描述**：支持 JSON/YAML/Markdown

**验收标准**：
```
expect(exportJSON).toBeSupported();
expect(exportYAML).toBeSupported();
expect(exportMarkdown).toBeSupported();
```

#### F14: 历史版本对比

**描述**：两版本 diff 可视化

**验收标准**：
```
expect(diffViewer).toBeDisplayed();
expect(version1).toBeDiffable(version2);
```

### 6.2 Epic 拆分

#### Epic 10: AI 质量（P2）

| Story | 描述 | 工时 |
|-------|------|------|
| S10.1 | flowId 填充修复 | 2h |
| S10.2 | prompt 优化 | 2h |

#### Epic 11: 导出与对比（P2）

| Story | 描述 | 工时 |
|-------|------|------|
| S11.1 | 导出格式扩展 | 3h |
| S11.2 | 版本对比 | 5h |

---

## 7. 优先级矩阵

| Phase | Impact | Effort | Score | 推荐 |
|-------|--------|--------|-------|------|
| Phase 0 Bug Fix | 🔴 极高 | 中 | ★★★★★ | **立即开始** |
| Phase 1 Phase2 | 🟡 高 | 中 | ★★★★☆ | Bug fix 后 |
| Phase 2 基础设施 | 🟢 中 | 中 | ★★★☆☆ | 并行进行 |
| Phase 3 UX | 🟢 中 | 高 | ★★☆☆☆ | V2 |

---

## 8. 快速启动清单

```bash
# B1 验证
grep -n "disabled={allConfirmed}" BoundedContextTree.tsx
# 期望：无结果

# Checkbox 验证
grep -n "selectionCheckbox" BoundedContextTree.tsx
# 期望：无结果

# BC Edge 验证
grep -n "flex-direction.*column" canvas.module.css
# 期望：无结果

# 组件树验证
grep -rn "未知页面" ComponentTree.tsx
# 期望：仅 fallback 路径
```

---

## 9. 非功能需求

| 需求 | 要求 |
|------|------|
| 性能 | gstack 验证响应 < 2s |
| 兼容性 | F11/ESC 不与浏览器冲突 |
| 可测试性 | 每个 Story 有单元测试 |

---

## 10. DoD (Definition of Done)

### Phase 0 DoD
- [ ] 所有 5 个 Bug 已修复
- [ ] gstack 截图验证通过
- [ ] npm test 100% 通过
- [ ] 快速启动清单全部通过
- [ ] git commit + PR

### Phase 1 DoD
- [ ] expand-both 和 maximize 可切换
- [ ] 交集高亮正常显示
- [ ] 起止节点有视觉标记

### Phase 2 DoD
- [ ] curl 通知已集成
- [ ] 提案自动汇总正常运行

### Phase 3 DoD
- [ ] AI 生成质量达标
- [ ] 导出格式全部支持
- [ ] 版本对比功能可用

---

## 11. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| Phase 0 Bug Fix 暴露新边缘 case | 完整回归测试（gstack） |
| Phase2 功能与 F1 约束冲突 | 全屏需要可编辑，务必验证 |
| AI prompt 改动影响现有组件 | 小数据集验证后再全量 |
