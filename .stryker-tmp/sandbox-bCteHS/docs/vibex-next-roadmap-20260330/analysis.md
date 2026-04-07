# Analysis: VibeX 下一阶段路线图 — 2026-03-30

> **任务**: vibex-next-roadmap-20260330/analyze-requirements
> **分析日期**: 2026-03-30
> **分析师**: Analyst Agent
> **项目**: vibex-next-roadmap-20260330
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

基于 gstack QA 验证和今日分析工作，VibeX Canvas 当前存在多个 P0/P1 问题影响核心流程。本次路线图聚焦：① 消除 product-blocking bug，② 完成 Phase2 功能集成，③ 建立通知基础设施。

---

## 2. gstack QA 现状验证（2026-03-30 03:32）

### 2.1 已验证状态

| 组件 | 状态 | 说明 |
|------|------|------|
| 阶段导航 | ✅ 正常 | 3个阶段全部 checked |
| 限界上下文树 | ✅ 正常 | 3个节点显示正确 |
| Flow Tree | ✅ 正常 | 4个流程节点 |
| Component Tree | ✅ 正常 | 5个组件，3个分组 |
| "继续→流程树" 按钮 | 🔴 B1 仍存在 | 全部确认后按钮文本显示"✓ 已确认 → 继续到流程树" |
| Checkbox | 🔴 双重checkbox | 每个节点旁边有"确认"checkbox（checked）+ selection checkbox |
| 导出/历史/搜索 | ✅ 功能正常 | 工具齐全 |

### 2.2 未验证项（需要深入交互）

| 组件 | 状态 |
|------|------|
| BC 树连线渲染 | 需截图验证（连线是否堆叠） |
| 组件树分类 | 需 AI 生成组件后验证 |
| Phase2 功能（OverlapHighlightLayer） | 需深入交互验证 |

---

## 3. 下一阶段路线图

### 3.1 Phase 0: Bug Fix Sprint（建议第0优先级）

**目标**：消除 product-blocking bug，恢复核心流程可用性

| Bug | 文件 | 根因 | 预计工时 |
|-----|------|------|---------|
| B1: 继续·流程树按钮禁用 | `BoundedContextTree.tsx:519` | `disabled={allConfirmed}` | 1h |
| Checkbox 去重 | `BoundedContextTree.tsx:233-256` | selection checkbox 与确认 checkbox 共存 | 6h |
| BC 树连线堆叠 | `canvas.module.css:809` | flex column 布局导致 dx=0 | 6h |
| 组件树分类错误 | `ComponentTree.tsx:51-53` | AI 生成 flowId='common' | 6h |
| OverlapHighlightLayer 未集成 | `CardTreeRenderer.tsx` | 缺少 import | 2h |

**小计**：~21h

**验收标准**：
- [ ] "已全部确认 → 继续到流程树" 按钮可点击（不显示 disabled）
- [ ] 每个 BC/组件卡片仅有一个交互 checkbox
- [ ] BC 树连线水平展开，无堆叠
- [ ] AI 生成组件后，组件树正确分组（非"未知页面"/"通用组件"）
- [ ] OverlapHighlightLayer 在 CanvasPage 中被正确导入

---

### 3.2 Phase 1: Phase2 功能完成

**目标**：完成 canvas-phase2 已设计但未集成的功能

| 功能 | 描述 | 预计工时 |
|------|------|---------|
| F1.1 expand-both 模式 | 三栏 1fr 1fr 1fr 并排展示 | 2h |
| F1.2 maximize 模式 | 全屏可编辑模式 + F11/ESC 快捷键 | 2h |
| F1.3 交集高亮 | 组件节点交集时高亮（OverlapHighlightLayer） | 3h |
| B2.2 起止节点标记 | 流程节点起止特殊视觉 | 2h |

**小计**：~9h

**F1 约束（已确认）**：全屏 = 可编辑画布模式，非只读。

**验收标准**：
- [ ] `expandMode='expand-both'` 时三栏并排
- [ ] F11 切换全屏，ESC 退出
- [ ] 有交集的组件节点显示高亮
- [ ] 起止节点有 ◉ / ◎ 视觉标记

---

### 3.3 Phase 2: 基础设施

**目标**：提升团队协作效率

| 功能 | 描述 | 预计工时 |
|------|------|---------|
| task_manager curl 通知 | phase1/phase2/update done/pending 自动 Slack 通知 | 7h |
| 提案收集自动化 | 每日提案自动汇总到 proposals/YYYYMMDD/ | 3h |

**小计**：~10h

---

### 3.4 Phase 3: 用户体验增强

**目标**：基于用户反馈优化核心体验

| 改进 | 描述 | 预计工时 |
|------|------|---------|
| AI 生成质量提升 | flowId 填充修复 + prompt 优化 | 4h |
| 导出格式扩展 | 支持 JSON/YAML/Markdown 格式 | 3h |
| 历史版本对比 | 两版本 diff 可视化 | 5h |

**小计**：~12h

---

## 4. 优先级决策矩阵

| Phase | Impact | Effort | Score | 推荐 |
|-------|--------|--------|-------|------|
| Phase 0 Bug Fix | 🔴 极高 | 中 | ★★★★★ | **立即开始** |
| Phase 1 Phase2 | 🟡 高 | 中 | ★★★★☆ | Bug fix 后 |
| Phase 2 基础设施 | 🟢 中 | 中 | ★★★☆☆ | 并行进行 |
| Phase 3 UX | 🟢 中 | 高 | ★★☆☆☆ | V2 |

---

## 5. 快速启动清单

**启动前验证**（gstack QA）：
```bash
# B1 验证
grep -n "disabled={allConfirmed}" BoundedContextTree.tsx
# 期望：无结果（已移除）

# Checkbox 验证
grep -n "selectionCheckbox" BoundedContextTree.tsx
# 期望：无结果（已移除）

# BC Edge 验证
grep -n "flex-direction.*column" canvas.module.css
# 期望：无结果（已改为 grid/flex-row）

# 组件树验证
grep -rn "未知页面" ComponentTree.tsx
# 期望：仅 fallback 路径
```

---

## 6. 风险与依赖

| 风险 | 缓解 |
|------|------|
| Phase 0 Bug Fix 可能暴露新的边缘 case | 完整回归测试（gstack） |
| Phase2 功能与现有 F1 约束冲突 | 全屏模式需要可编辑，务必验证 |
| AI 生成 prompt 改动影响现有组件 | 先在小数据集验证再全量 |

---

## 7. 总结

**立即执行（本周）**：Phase 0 Bug Fix Sprint（21h）
**下周**：Phase 1 Phase2 完成 + Phase 2 基础设施
**V2**：Phase 3 UX 增强

**今日提案收集已产出**：`proposal-collection-20260330/analysis.md`
