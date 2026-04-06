# PRD: VibeX PM Proposals 2026-04-11

> **项目**: vibex-pm-proposals-vibex-proposals-20260411
> **目标**: 将 10 条 PM 提案拆分为可实施 Epic / Story
> **来源**: PM 提案收集（10 条提案，P0×3 / P1×3 / P2×4）
> **PRD 作者**: pm agent
> **日期**: 2026-04-11
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
2026-04-11 PM 提案收集完成，共 10 条提案（P0×3 / P1×3 / P2×4）。基于 20260410 Sprint 遗留 + 新发现痛点，聚焦**用户输入质量**和**企业协作场景**。

### 目标
- P0: 需求智能补全（AI 主动澄清）+ 项目搜索过滤 + flowId E2E 验证
- P1: 团队协作 UI + 版本对比 + Tree 按钮统一
- P2: 快捷键 + 离线提示 + 导入导出 + AI 评分

### 成功指标
- AC1: 需求智能补全触发率 ≥ 80%（输入模糊时）
- AC2: 项目搜索响应 < 200ms
- AC3: flowId E2E 测试 100% 通过
- AC4: 团队协作 UI 支持多用户并发编辑
- AC5: 版本对比差异高亮显示

---

## 2. Planning — Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时 | 优先级 |
|----|--------|------|---------|------|--------|
| F1.1 | AI 智能补全 | 输入过程实时检测关键词，触发澄清追问 | 模糊输入生成质量差 | 5h | P0 |
| F1.2 | 项目搜索过滤 | 全局搜索 + 时间/状态过滤 | 10+ 项目后无法定位 | 3h | P0 |
| F1.3 | flowId E2E 验证 | 补充 E2E 测试验证 flowId 关联正确 | Dev 已修复但无测试保护 | 2h | P0 |
| F2.1 | 团队协作空间 UI | 团队管理 + 成员邀请 + 协作指示器 | KV 后端就绪 UI 缺失 | 6h | P1 |
| F2.2 | 版本历史对比 | 版本快照 + 对比视图 + 回滚 | 无版本追踪功能 | 5h | P1 |
| F2.3 | Tree 按钮样式统一 | 统一 TreeToolbarButton 组件 | Toolbar 样式不统一 | 2h | P1 |
| F3.1 | 快捷键系统 | Ctrl+S/Z/Enter + 帮助面板 | 高级用户操作效率低 | 2h | P2 |
| F3.2 | 离线模式提示 | navigator.onLine 检测 + 提示条 | 离线时无明确提示 | 1h | P2 |
| F3.3 | 需求导入导出 | Markdown/JSON/YAML 导入 + 导出 | 无法导入已有文档 | 3h | P2 |
| F3.4 | AI 生成评分 | 1-5 星评分 + 文字反馈 | 无法反馈 AI 质量 | 2h | P2 |

**总工时**: 31h

---

## 3. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | Stories |
|------|------|--------|------|---------|
| E1 | 需求输入质量提升 | P0 | 10h | S1.1, S1.2, S1.3 |
| E2 | 企业协作场景 | P1 | 13h | S2.1, S2.2, S2.3 |
| E3 | 体验优化 | P2 | 8h | S3.1, S3.2, S3.3, S3.4 |

---

### Epic 1: 需求输入质量提升（P0）

**根因**: 模糊输入生成质量差 + 项目增多后无法定位 + flowId 无测试保护。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | AI 智能补全 | 5h | 触发率 ≥ 80%，响应 < 1s |
| S1.2 | 项目搜索过滤 | 3h | 搜索响应 < 200ms |
| S1.3 | flowId E2E 验证 | 2h | 测试 100% 通过 |

**S1.1 验收标准**:
- `expect(keywordDetector.detect(模糊输入)).toBeTruthy()` ✓
- `expect(clarifyResponseTime).toBeLessThan(1000)` ✓
- `expect(triggerRate).toBeGreaterThan(0.8)` ✓

**S1.2 验收标准**:
- `expect(searchResponseTime).toBeLessThan(200)` ✓
- `expect(filterByName('proj')).toMatchObject(expected)` ✓
- `expect(debounce300ms).toUpdateResults())` ✓

**S1.3 验收标准**:
- `expect(flowIdE2E.test.ts).toPass()` ✓
- `expect(ComponentRegistry.get(flowId)).toBeDefined()` ✓

**DoD**:
- [ ] AI 智能补全触发率 ≥ 80%
- [ ] 项目搜索响应 < 200ms，支持名称/时间/状态过滤
- [ ] flowId E2E 测试 100% 通过

---

### Epic 2: 企业协作场景（P1）

**根因**: KV 后端就绪但 UI 缺失 + 无版本历史 + Tree 按钮不统一。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 团队协作空间 UI | 6h | 多用户并发编辑 |
| S2.2 | 版本历史对比 | 5h | 差异高亮 + 回滚 |
| S2.3 | Tree 按钮统一 | 2h | 样式一致 |

**S2.1 验收标准**:
- `expect(createTeam.flowId).toBeDefined()` ✓
- `expect(inviteMember.email).toBeInvited()` ✓
- `expect(concurrentEdit.kvConflictCount).toBe(0)` ✓

**S2.2 验收标准**:
- `expect(versionList.length).toBeGreaterThan(0)` ✓
- `expect(diffViewer.highlighted).toBe(true)` ✓
- `expect(rollback.success).toBe(true)` ✓

**S2.3 验收标准**:
- `expect(TreeToolbarButton.styles).toMatchSnapshot()` ✓
- `expect(iconOnly.icon).toEqual(iconText.icon)` ✓

**DoD**:
- [ ] 团队创建和管理流程完整可用
- [ ] 版本历史可查看、可对比、可回滚
- [ ] Tree 面板所有按钮样式统一

---

### Epic 3: 体验优化（P2）

**根因**: 快捷键缺失 + 离线无提示 + 无法导入导出 + 无法评分。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 快捷键系统 | 2h | Ctrl+S/Z/Enter |
| S3.2 | 离线模式提示 | 1h | 提示条显示 |
| S3.3 | 需求导入导出 | 3h | .md/.json/.yaml |
| S3.4 | AI 生成评分 | 2h | 1-5 星评分 |

**S3.1 验收标准**:
- `expect(ctrlS.saved).toBe(true)` ✓
- `expect(ctrlZ.undone).toBe(true)` ✓
- `expect(helpPanel.visible).toBe(true)` ✓

**S3.2 验收标准**:
- `expect(offlineBanner.visible).toBe(true)` ✓
- `expect(banner文案).toBeTruthy()` ✓

**S3.3 验收标准**:
- `expect(import.md).toParseCorrectly()` ✓
- `expect(export.json.download).toBe(true)` ✓

**S3.4 验收标准**:
- `expect(starRating.selected).toBe(true)` ✓
- `expect(feedback.saved).toBe(true)` ✓

**DoD**:
- [ ] 快捷键帮助面板可查看
- [ ] 离线提示条显示明确
- [ ] 导入导出功能完整
- [ ] AI 评分数据可存储

---

## 4. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | AI 智能补全 | E1 | expect(triggerRate ≥ 80%) | 【需页面集成】 |
| F1.2 | 项目搜索过滤 | E1 | expect(response < 200ms) | 【需页面集成】 |
| F1.3 | flowId E2E 验证 | E1 | expect(e2e pass 100%) | 无 |
| F2.1 | 团队协作空间 UI | E2 | expect(concurrent edit OK) | 【需页面集成】 |
| F2.2 | 版本历史对比 | E2 | expect(diff highlighted) | 【需页面集成】 |
| F2.3 | Tree 按钮统一 | E2 | expect(styles consistent) | 【需页面集成】 |
| F3.1 | 快捷键系统 | E3 | expect(ctrlS saved) | 【需页面集成】 |
| F3.2 | 离线模式提示 | E3 | expect(banner visible) | 【需页面集成】 |
| F3.3 | 需求导入导出 | E3 | expect(import parse OK) | 【需页面集成】 |
| F3.4 | AI 生成评分 | E3 | expect(stars saved) | 【需页面集成】 |

---

## 5. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 模糊输入 | AI 检测 | 触发率 ≥ 80% |
| AC2 | 项目列表 | 搜索 | 响应 < 200ms |
| AC3 | flowId E2E | 测试运行 | 100% 通过 |
| AC4 | 团队创建 | 多用户并发 | 0 冲突 |
| AC5 | 版本历史 | 对比视图 | 差异高亮 |

---

## 6. DoD (Definition of Done)

### E1: 需求输入质量提升
- [ ] AI 智能补全触发率 ≥ 80%
- [ ] 项目搜索支持名称/时间/状态过滤
- [ ] flowId E2E 测试 100% 通过

### E2: 企业协作场景
- [ ] 团队创建/邀请/权限完整
- [ ] 版本历史可查看、可对比、可回滚
- [ ] Tree 按钮样式通过快照测试

### E3: 体验优化
- [ ] 快捷键帮助面板可查看
- [ ] 离线提示明确
- [ ] 导入导出支持 .md/.json/.yaml
- [ ] AI 评分数据可存储

---

## 7. 实施计划

### Sprint 1 (P0, 10h)
| Story | 内容 | 工时 |
|-------|------|------|
| S1.1 | AI 智能补全 | 5h |
| S1.2 | 项目搜索过滤 | 3h |
| S1.3 | flowId E2E | 2h |

### Sprint 2 (P1, 13h)
| Story | 内容 | 工时 |
|-------|------|------|
| S2.1 | 团队协作 UI | 6h |
| S2.2 | 版本历史对比 | 5h |
| S2.3 | Tree 按钮统一 | 2h |

### Sprint 3 (P2, 8h)
| Story | 内容 | 工时 |
|-------|------|------|
| S3.1 | 快捷键系统 | 2h |
| S3.2 | 离线模式提示 | 1h |
| S3.3 | 需求导入导出 | 3h |
| S3.4 | AI 生成评分 | 2h |

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
