# PRD: vibex-step2-regression

**项目**: vibex-step2-regression  
**阶段**: create-prd  
**日期**: 2026-03-20  
**Agent**: pm

---

## 执行摘要

修复 vibex-step2-issues 引入的两个回归问题：
1. UI组件分析点不了
2. 第一步流程图不显示

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| UI组件点击响应 | 失败 | 可点击 + 正确响应 |
| 流程图显示 | 不显示 | 正常渲染 |
| 首页→Design 数据同步 | 无同步 | 自动同步 |

---

## Epic 拆分

### Epic 1: 修复 UI 组件分析点击问题 (P0)

**目标**: 修复 UI 组件分析无法点击的问题

| Story | 功能 | 验收标准 | 优先级 |
|-------|------|----------|--------|
| ST-01 | 点击响应修复 | `expect(screen.getByTestId('component-analysis')).toBeEnabled()` | P0 |
| ST-02 | 事件绑定验证 | `expect(handleClick).toHaveBeenCalled()` | P0 |

**功能点**:
| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | UI组件点击响应 | 组件分析按钮可点击 | `expect(screen.getByRole('button', {name: /component.*analysis/i})).not.toBeDisabled()` | 【需页面集成】HomePage.tsx |
| F1.2 | 点击事件绑定 | 点击后触发正确处理函数 | `expect(mockHandler).toHaveBeenCalledTimes(1)` | 【需页面集成】ComponentAnalysis.tsx |

**DoD**: 
- [ ] 点击事件已绑定
- [ ] 按钮状态正确（非 disabled）
- [ ] 单元测试通过

---

### Epic 2: 修复第一步流程图不显示 (P0)

**目标**: 修复首页第一步完成后流程图不渲染的问题

| Story | 功能 | 验收标准 | 优先级 |
|-------|------|----------|--------|
| ST-03 | 流程图渲染修复 | `expect(container.querySelector('.mermaid')).toBeInTheDocument()` | P0 |
| ST-04 | mermaidCode 更新逻辑 | `expect(mermaidCode).toContainString('graph TD')` | P0 |
| ST-05 | 状态更新后重新渲染 | `expect(screen.getByText(/flow.*chart/i)).toBeVisible()` | P1 |

**功能点**:
| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 流程图容器渲染 | Mermaid 容器正常挂载 | `expect(document.querySelector('.mermaid svg')).toBeInTheDocument()` | 【需页面集成】FlowChart.tsx |
| F2.2 | mermaidCode 状态同步 | 生成后更新状态触发重渲染 | `expect(mermaidCode).toMatch(/graph\s+TD\|LR/)` | 【需页面集成】useConfirmationStore.ts |
| F2.3 | 首页→Design 数据同步 | 首页数据同步到 designStore | `expect(designStore.boundedContexts).toEqual(confirmationStore.boundedContexts)` | 【需页面集成】designStore.ts |

**DoD**:
- [ ] mermaidCode 非空且格式正确
- [ ] 流程图 SVG 渲染成功
- [ ] HomePage → DesignPage 数据同步正常

---

### Epic 3: 验证与回归测试 (P0)

**目标**: 确保修复不引入新问题

| Story | 功能 | 验收标准 | 优先级 |
|-------|------|----------|--------|
| ST-06 | E2E 测试覆盖 | `expect(page.goto('/')).toResolve()` | P0 |
| ST-07 | 回归测试套件 | `npm test -- --testPathPattern=step2` | P0 |

**功能点**:
| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 首页加载测试 | 首页正常加载无 console.error | `expect(console.error).not.toHaveBeenCalled()` | 【需页面集成】HomePage.e2e.ts |
| F3.2 | 流程完成测试 | 三步流程完成后 Design 页面有数据 | `expect(await page.locator('.bounded-context').count()).toBeGreaterThan(0)` | 【需页面集成】DesignPage.e2e.ts |

**DoD**:
- [ ] 所有 E2E 测试通过
- [ ] 无 console.error/warning
- [ ] npm run build 成功

---

## 根因分析摘要

| 问题 | 根因 | 修复位置 |
|------|-------|----------|
| UI组件点不了 | 事件未绑定或按钮 disabled | ComponentAnalysis.tsx |
| 流程图不显示 | confirmationStore → designStore 无同步 | designStore.ts / useConfirmationStore.ts |
| 第一步流程图不显示 | mermaidCode 未更新 | FlowChart.tsx |

---

## 技术约束

- 修复范围仅限 `vibex-fronted/src/`
- 不能破坏现有 Step 流程
- 必须向后兼容 Step 1/2/3

## 实施计划

| 阶段 | 任务 | 预计工时 |
|------|------|----------|
| Phase 1 | 修复 UI 点击问题 (ST-01~02) | 1h |
| Phase 2 | 修复流程图显示 (ST-03~05) | 2h |
| Phase 3 | 添加数据同步 (F2.3) | 1h |
| Phase 4 | E2E 测试验证 (ST-06~07) | 1h |

**总预计工时**: 5h

---

*PRD 产出物 - PM Agent*
