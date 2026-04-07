# PRD: VibeX PM Proposals 2026-04-08

> **项目**: vibex-pm-proposals-vibex-proposals-20260408
> **目标**: 修复 Canvas 画布 P0 Bug + 补齐 P1 UX 缺口 + 治理 P2 架构债
> **来源**: proposals/20260408/pm.md
> **PRD 作者**: pm agent
> **日期**: 2026-04-08
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
PM 审视 VibeX Canvas 画布发现 7 个问题：
- **P0 Bug×2**: 组件生成空数据无兜底（E3 回退逻辑不健壮）；删除按钮未绑定
- **P1 UX×3**: 无新手引导、新用户不知道如何写需求；项目搜索缺失
- **P2 TechDebt×2**: 三树代码重复 >3700 行；Undo/Redo 不稳定

### 目标
- P0: 止血（空数据兜底 + 删除按钮绑定）
- P1: 补齐用户体验短板（模板库 + 引导 + 搜索）
- P2: 架构治理（三树抽象 + Undo/Redo）

### 成功指标
- AC1: 组件生成空数据/错误时有 EmptyState + Toast
- AC2: 三树删除按钮正确绑定，选中节点可删除
- AC3: 新用户首次访问有 3 步引导蒙层
- AC4: Dashboard 支持项目搜索（debounce 300ms）
- AC5: 模板库 ≥3 个行业模板，点击自动填充
- AC6: TreeToolbar 独立抽取，TypeScript 编译通过
- AC7: Undo/Redo 操作链路正常（E2E 测试通过）

---

## 2. Planning — Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 | 优先级 |
|----|--------|------|---------|------|--------|
| F1.1 | flowId 空值校验 | flowId 为空时禁用生成按钮 | P-P0-1 | 0.5h | P0 |
| F1.2 | EmptyState 组件 | 组件生成空数据时显示友好提示 | P-P0-1 | 1h | P0 |
| F1.3 | Toast 错误提示 | API 错误时显示 Toast | P-P0-1 | 0.5h | P0 |
| F2.1 | 删除按钮绑定 | onDelete 正确传递到三树 | P-P0-2 | 1h | P0 |
| F3.1 | 引导蒙层 | 首次访问 Canvas 显示引导 | P-P1-1 | 4h | P1 |
| F4.1 | 项目搜索 | Dashboard 搜索框 + 过滤 | P-P1-2 | 6h | P1 |
| F5.1 | 模板库 | 3-5 个行业模板，点击填充 | P-P1-3 | 3h | P1 |
| F6.1 | TreeToolbar 抽取 | 独立组件供三树共用 | P-P2-1 | 4h | P2 |
| F6.2 | useTreeState Hook | 抽取三树共享状态逻辑 | P-P2-1 | 4h | P2 |
| F7.1 | Undo/Redo 验证 | 验证 recordSnapshot + UndoBar 链路 | P-P2-2 | 2h | P2 |
| F7.2 | 快捷键支持 | Ctrl+Z / Ctrl+Shift+Z | P-P2-2 | 2h | P2 |
| **合计** | | | | **28h** | |

---

## 3. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 提案来源 |
|------|------|--------|------|----------|
| E1 | 组件生成空数据兜底 | P0 | 2h | P-P0-1 |
| E2 | 删除按钮绑定 | P0 | 1h | P-P0-2 |
| E3 | 新手引导蒙层 | P1 | 4h | P-P1-1 |
| E4 | 项目搜索 | P1 | 6h | P-P1-2 |
| E5 | 需求模板库 | P1 | 3h | P-P1-3 |
| E6 | 三树共享抽象 | P2 | 8h | P-P2-1 |
| E7 | Undo/Redo 稳定性 | P2 | 4h | P-P2-2 |
| **合计** | | | **28h** | |

---

### Epic 1: 组件生成空数据兜底

**问题根因**: generateComponents API 返回空数据时无兜底 UI，flowId='' 时仍发起无效请求。

**提案引用**: P-P0-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | flowId 空值校验 | 0.5h | 按钮 disabled |
| S1.2 | EmptyState 组件 | 1h | 空数据时显示兜底 UI |
| S1.3 | Toast 错误提示 | 0.5h | 错误时显示 Toast |

**S1.1 验收标准**:
- `expect(screen.queryByText('继续·组件树')).toBeDisabled()` when flowId === '' ✓
- `expect(handleContinueToComponents).not.toHaveBeenCalled()` when flowId === '' ✓

**S1.2 验收标准**:
- `expect(screen.getByText(/组件生成失败/i)).toBeInTheDocument()` when components.length === 0 ✓
- `expect(screen.getByText(/重试/i)).toBeInTheDocument()` ✓

**S1.3 验收标准**:
- `expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('组件生成'))` ✓
- `expect(toast.error).toHaveBeenCalled()` within 5s ✓

**DoD**:
- [ ] flowId 为空时"继续·组件树"按钮 disabled
- [ ] 空数据时显示 EmptyState（含重试按钮）
- [ ] HTTP 错误时显示 Toast 提示（≤5s 自动消失）
- [ ] E2E 测试：选中 flow → 点击生成 → 验证空数据兜底 UI

---

### Epic 2: 删除按钮绑定

**问题根因**: TreeToolbar 的 onDelete prop 未正确连接到三树 store 的 deleteSelectedNodes。

**提案引用**: P-P0-2

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 三树删除按钮绑定 | 1h | 按钮功能正常 |

**S2.1 验收标准**:
- `expect(screen.getByLabelText(/删除/i)).toBeEnabled()` when nodes selected ✓
- `expect(screen.getByLabelText(/删除/i)).toBeDisabled()` when no nodes selected ✓
- 点击删除 → confirm dialog 出现 ✓
- 确认后 → `expect(screen.queryByText(selectedNodeName)).not.toBeInTheDocument()` ✓

**DoD**:
- [ ] 三树（Context/Flow/Component）TreeToolbar 的 onDelete 正确绑定
- [ ] 删除前弹出确认对话框（"确认删除 N 个节点？"）
- [ ] 无选中节点时删除按钮 disabled
- [ ] 删除操作触发 recordSnapshot
- [ ] E2E 测试：选中 2 个节点 → 点击删除 → 验证节点减少

---

### Epic 3: 新手引导蒙层

**问题根因**: 用户首次进入 Canvas 不知道从哪开始，无引导提示。

**提案引用**: P-P1-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 引导蒙层组件 | 2h | 引导显示 |
| S3.2 | 引导步骤配置 | 1h | 步骤内容 |
| S3.3 | 跳过 + 示例入口 | 1h | 跳过功能 |

**S3.1 验收标准**:
- `expect(screen.getByText(/Step 1/i)).toBeInTheDocument()` on first visit ✓
- `expect(localStorage.getItem('canvas_onboarded')).toBeNull()` before skip ✓
- 刷新页面 → `expect(screen.queryByText(/Step 1/i)).not.toBeInTheDocument()` ✓

**DoD**:
- [ ] 首次访问 Canvas（无 onboarded 标记）显示 3 步引导蒙层
- [ ] 每步有箭头指向目标元素
- [ ] "跳过引导"按钮可取消蒙层 + 设置 localStorage
- [ ] 引导结束后提供"体验示例"入口
- [ ] E2E 测试：清除 canvas_onboarded → 访问 Canvas → 验证引导出现

---

### Epic 4: 项目搜索

**问题根因**: 项目增多后无法快速定位。

**提案引用**: P-P1-2

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | 搜索框组件 | 2h | 搜索框存在 |
| S4.2 | 实时过滤逻辑 | 2h | debounce 300ms |
| S4.3 | 键盘导航 | 2h | 上下键导航 |

**S4.1 验收标准**:
- `expect(screen.getByPlaceholderText(/搜索项目/i)).toBeInTheDocument()` ✓

**S4.2 验收标准**:
- 输入 "电商" → `expect(screen.getAllByText(/电商/i).length).toBeGreaterThan(0)` within 500ms ✓
- 搜索无结果 → `expect(screen.getByText(/无结果/i)).toBeInTheDocument()` ✓

**S4.3 验收标准**:
- 聚焦搜索框 → 按下 ArrowDown → 第一个结果高亮 ✓

**DoD**:
- [ ] Dashboard 显示搜索输入框
- [ ] 实时过滤（debounce 300ms），支持模糊匹配
- [ ] 支持按时间/名称排序
- [ ] 键盘上下键可导航
- [ ] 无结果时显示空状态 + "创建新项目" 入口

---

### Epic 5: 需求模板库

**问题根因**: 新用户不知道如何描述业务需求。

**提案引用**: P-P1-3

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | 模板卡片组件 | 1.5h | 卡片显示 |
| S5.2 | 模板 JSON 配置 | 1h | 可扩展 |
| S5.3 | 模板填充逻辑 | 0.5h | 自动填充 |

**S5.1 验收标准**:
- `expect(screen.getAllByText(/电商系统/i).length).toBeGreaterThan(0)` ✓
- `expect(screen.getAllByText(/社交平台/i).length).toBeGreaterThan(0)` ✓

**S5.2 验收标准**:
- `expect(fs.existsSync('templates/requirement-templates.json')).toBe(true)` ✓
- 新增模板只需修改 JSON，无需改代码 ✓

**S5.3 验收标准**:
- 点击"电商系统"模板 → `expect(screen.getByRole('textbox').value).toContain('电商')` ✓
- 点击"自定义需求"→ 模板消失，输入框可用 ✓

**DoD**:
- [ ] Canvas 需求输入区显示 ≥3 个模板卡片
- [ ] 每个模板有行业图标和简介
- [ ] 点击模板自动填充输入框
- [ ] "自定义需求"可跳过模板
- [ ] E2E 测试：点击模板 → 验证输入框内容

---

### Epic 6: 三树共享抽象

**问题根因**: 三树组件各自独立实现，TreeToolbar/DedupeButton 重复。

**提案引用**: P-P2-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S6.1 | TreeToolbar 抽取 | 4h | 独立组件 |
| S6.2 | useTreeState Hook | 4h | Hook 复用 |

**S6.1 验收标准**:
- `expect(fs.existsSync('components/canvas/TreeToolbar.tsx')).toBe(true)` ✓
- `expect(tsc --noEmit components/canvas/TreeToolbar.tsx).toBe(0)` ✓
- 三树减少重复代码 ≥30% ✓

**S6.2 验收标准**:
- `expect(fs.existsSync('hooks/useTreeState.ts')).toBe(true)` ✓
- `expect(tsc --noEmit hooks/useTreeState.ts).toBe(0)` ✓

**DoD**:
- [ ] `TreeToolbar` 抽取为独立组件，供三树共用
- [ ] `useTreeState` Hook 抽取三树共享状态逻辑
- [ ] TypeScript 编译通过，无新增错误
- [ ] 现有 E2E 测试全部通过
- [ ] 三树各自减少 ≥30% 代码行数

---

### Epic 7: Undo/Redo 稳定性

**问题根因**: UndoBar.tsx 有大量 as any，recordSnapshot 未验证完整链路。

**提案引用**: P-P2-2

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S7.1 | UndoBar 链路验证 | 2h | 链路正确 |
| S7.2 | 快捷键支持 | 2h | Ctrl+Z |

**S7.1 验收标准**:
- 添加节点 → `expect(screen.getByText(/撤销/i)).toBeEnabled()` ✓
- 点击撤销 → `expect(screen.queryByText(addedNodeName)).not.toBeInTheDocument()` ✓
- 撤销后 → `expect(screen.getByText(/重做/i)).toBeEnabled()` ✓

**S7.2 验收标准**:
- 聚焦 Canvas → `expect(handleKeyDown({ key: 'z', ctrlKey: true })).toHaveBeenCalled()` ✓
- `expect(screen.getByText(/撤销 \d+ 步/i)).toBeInTheDocument()` ✓

**DoD**:
- [ ] UndoBar 正确消费 recordSnapshot 数据
- [ ] Ctrl+Z / Ctrl+Shift+Z 快捷键正常工作
- [ ] UndoBar 显示当前历史步数
- [ ] 无历史时 UndoBar 显示 disabled
- [ ] E2E 测试：添加→撤销→重做链路验证通过

---

## 4. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | flowId 空值校验 | E1 | expect(disabled) | 【需页面集成】 |
| F1.2 | EmptyState 组件 | E1 | expect(/组件生成失败/).toBeInTheDocument() | 【需页面集成】 |
| F1.3 | Toast 错误提示 | E1 | expect(toast.error).toHaveBeenCalled() | 【需页面集成】 |
| F2.1 | 删除按钮绑定 | E2 | expect(deleteBtn).toBeEnabled() | 【需页面集成】 |
| F3.1 | 引导蒙层 | E3 | expect(step1).toBeInTheDocument() | 【需页面集成】 |
| F4.1 | 项目搜索框 | E4 | expect(searchInput).toBeInTheDocument() | 【需页面集成】 |
| F4.2 | 实时过滤 | E4 | expect(filtered.length).toBe(1) | 无 |
| F5.1 | 模板卡片 | E5 | expect(card.textContent).toContain('电商') | 【需页面集成】 |
| F6.1 | TreeToolbar 抽取 | E6 | expect(tsc).toBe(0) | 无 |
| F6.2 | useTreeState Hook | E6 | expect(tsc).toBe(0) | 无 |
| F7.1 | UndoBar 链路 | E7 | expect(undo).toBeEnabled() | 【需页面集成】 |
| F7.2 | 快捷键 | E7 | expect(handleKeyDown).toHaveBeenCalled() | 【需页面集成】 |

---

## 5. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | flowId === '' | 渲染"继续·组件树"按钮 | disabled |
| AC2 | 组件生成返回 [] | API 调用完成 | EmptyState 显示 |
| AC3 | API 返回 HTTP 500 | 调用完成 | Toast 错误提示（≤5s） |
| AC4 | 选中节点 | 点击删除 | 确认对话框 → 节点消失 |
| AC5 | 无 onboarded 标记 | 首次访问 Canvas | 引导蒙层出现（3 步） |
| AC6 | Dashboard 项目列表 | 输入搜索词 | 300ms 内过滤结果 |
| AC7 | 点击"电商系统"模板 | 模板点击 | 输入框自动填充 |
| AC8 | TreeToolbar.tsx | tsc --noEmit | 0 errors |
| AC9 | 添加节点 | Ctrl+Z | 节点消失 |
| AC10 | 无历史 | 渲染 UndoBar | disabled 状态 |

---

## 6. DoD (Definition of Done)

### E1: 组件生成空数据兜底
- [ ] flowId 为空时禁用"继续·组件树"按钮
- [ ] 空数据时显示 EmptyState（含重试按钮）
- [ ] HTTP 错误时显示 Toast
- [ ] E2E 测试验证

### E2: 删除按钮绑定
- [ ] 三树 onDelete 正确绑定
- [ ] 确认对话框
- [ ] recordSnapshot 触发
- [ ] E2E 测试验证

### E3: 新手引导蒙层
- [ ] 首次访问显示 3 步引导
- [ ] 跳过功能正常
- [ ] E2E 测试验证

### E4: 项目搜索
- [ ] 搜索框 + 实时过滤
- [ ] 键盘导航
- [ ] 空状态处理

### E5: 需求模板库
- [ ] ≥3 个模板卡片
- [ ] 点击填充输入框
- [ ] JSON 可扩展

### E6: 三树共享抽象
- [ ] TreeToolbar 独立文件
- [ ] useTreeState Hook
- [ ] TypeScript 编译通过
- [ ] 三树代码各减少 ≥30%

### E7: Undo/Redo 稳定性
- [ ] Undo/Redo 链路正确
- [ ] 快捷键支持
- [ ] E2E 测试验证

---

## 7. 实施计划

### Sprint 1 (P0 止血, 3h)
| Epic | 内容 | 工时 |
|------|------|------|
| E1 | 组件生成空数据兜底 | 2h |
| E2 | 删除按钮绑定 | 1h |

### Sprint 2 (P1 UX, 13h)
| Epic | 内容 | 工时 |
|------|------|------|
| E5 | 需求模板库 | 3h |
| E3 | 新手引导蒙层 | 4h |
| E4 | 项目搜索 | 6h |

### Sprint 3 (P2 架构, 12h)
| Epic | 内容 | 工时 |
|------|------|------|
| E6 | 三树共享抽象 | 8h |
| E7 | Undo/Redo 稳定性 | 4h |

---

## 8. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | 项目搜索 debounce 300ms，不过滤不卡顿 |
| 兼容性 | 模板库 JSON 格式变更向后兼容 |
| 可测试性 | 所有功能点有 E2E 测试覆盖 |

---

## 9. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 三树 store 方法签名不一致 | 先搜索确认 deleteSelectedNodes 存在再实施 |
| 引导步骤与 DOM 耦合 | 使用 CSS class 定位而非 DOM 结构 |
| Undo/Redo 测试不稳定 | 使用 Vitest mock recordSnapshot 隔离测试 |

---

*文档版本: v1.0 | 最后更新: 2026-04-08*
