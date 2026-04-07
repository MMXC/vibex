# Implementation Plan: canvas-quick-generate-command

**Agent**: architect
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 总体计划

| 项目 | 值 |
|------|---|
| **总工时** | 2h |
| **优先级** | P0 |
| **Epic** | E1: Ctrl+G 快速生成命令 |
| **依赖** | 无外部依赖 |

---

## 2. 任务分解

### Phase 1: E1-S1 键盘绑定 + useCallback（0.5h）

**目标**: 在 `CanvasPage.tsx` 添加 `Ctrl+G` 键盘监听和 `quickGenerate` 回调骨架

**任务列表**:

| 步骤 | 时长 | 任务 | 产出物 |
|------|------|------|--------|
| 1.1 | 0.1h | 在 `CanvasPage.tsx` 新增 `useCallback quickGenerate` 骨架（console.log 占位） | `quickGenerate` 函数定义 |
| 1.2 | 0.2h | 添加 `useEffect` 监听 `keydown`，检测 `Ctrl+G` / `Cmd+G`，调用 `quickGenerate` | 键盘监听器 |
| 1.3 | 0.1h | 添加 `e.preventDefault()` 阻止浏览器默认行为 | — |
| 1.4 | 0.1h | 本地 Playwright 测试确认 `Ctrl+G` 可触发 | 验证通过 |

**验收标准**:
- `Ctrl+G` / `Cmd+G` 按下时 `quickGenerate` 被调用
- 浏览器默认 `Ctrl+G` 行为被阻止

**代码位置**:
```
vibex-fronted/src/components/canvas/CanvasPage.tsx
```

---

### Phase 2: E1-S2 空输入检测（0.5h）

**目标**: 检测 `requirementText` 为空时显示 warning toast

**任务列表**:

| 步骤 | 时长 | 任务 | 产出物 |
|------|------|------|--------|
| 2.1 | 0.1h | 确认 `requirementText` 和 `showToast` 在 CanvasPage 中的引用方式 | 确认 API |
| 2.2 | 0.2h | 在 `quickGenerate` 开头添加空值守卫: `if (!requirementText.trim()) { showToast('请先输入需求', 'warning'); return; }` | 空输入处理 |
| 2.3 | 0.1h | 在 `quickGenerate` useCallback 依赖数组中添加 `requirementText` | 依赖正确 |
| 2.4 | 0.1h | Playwright 测试确认空输入 toast | `请先输入需求` toast 出现 |

**验收标准**:
- 无需求输入时按 `Ctrl+G` 显示 `请先输入需求` warning toast
- 有需求输入时继续执行后续逻辑

---

### Phase 3: E1-S3 级联 API 调用 + 错误处理（1h）

**目标**: 实现完整的三树级联生成逻辑，包含 `isGenerating` 守卫和错误处理

**任务列表**:

| 步骤 | 时长 | 任务 | 产出物 |
|------|------|------|--------|
| 3.1 | 0.1h | 确认 `generateContextsFromRequirement` / `autoGenerateFlows` / `generateComponentFromFlow` 在 canvasStore 中的签名 | API 签名确认 |
| 3.2 | 0.2h | 在 `quickGenerate` 中添加 `isGenerating` 守卫: `if (isGenerating) return;` | 重复触发阻止 |
| 3.3 | 0.3h | 实现级联调用: generateContexts → autoGenerateFlows → generateComponentFromFlow | 完整流程 |
| 3.4 | 0.2h | 添加 try/catch + 错误 toast: `catch(error) { showToast(error.message \|\| '生成失败', 'error'); }` + finally `setIsGenerating(false)` | 错误处理 |
| 3.5 | 0.1h | 添加成功 toast: `showToast('三树生成完成', 'success')` | 成功提示 |
| 3.6 | 0.1h | Playwright E2E 验证三树节点出现 | 节点数量断言 |

**验收标准**:
- `isGenerating` 为 true 时 `Ctrl+G` 不触发新生成
- 三树（Context → Flow → Component）依次生成
- 失败时显示 error toast
- 完成后 `isGenerating` 恢复 false

---

### Phase 4: ShortcutHintPanel 更新（随 Phase 1 顺便完成）

**目标**: 在快捷键提示面板显示 `Ctrl+G: 快速生成`

**任务列表**:

| 步骤 | 时长 | 任务 | 产出物 |
|------|------|------|--------|
| 4.1 | 0.05h | 在 `ShortcutHintPanel.tsx` 的 `SHORTCUTS` 数组添加 `{ keys: ['Ctrl', 'G'], description: '快速生成' }` | 快捷键列表更新 |
| 4.2 | 0.05h | Playwright 验证 `?` 打开面板后可见 `Ctrl+G` | 快捷键面板测试 |

---

## 3. 时间线

```
0:00 ───────────────────────────────────────── 2:00
 ├─ Phase 1 (0.5h)  键盘绑定 + useCallback
 ├─ Phase 2 (0.5h)  空输入检测 + toast
 ├─ Phase 3 (1.0h)  级联 API + 错误处理
 └─ Phase 4 (随 Phase 1)  ShortcutHintPanel 更新
```

**甘特图（Mermaid）**:

```mermaid
gantt
    title Ctrl+G 快速生成实现计划
    dateFormat X
    axisFormat %H:%M

    section E1-S1
    键盘绑定 + useCallback    :done, 0, 30m
    section E1-S2
    空输入检测 + toast        :done, 30m, 60m
    section E1-S3
    级联 API + 错误处理       :done, 60m, 120m
    section F1.6
    ShortcutHintPanel 更新    :done, 0, 10m
```

---

## 4. 验证命令

### 4.1 启动开发服务器

```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm dev
# 访问 http://localhost:3000/canvas
```

### 4.2 运行 E2E 测试

```bash
cd /root/.openclaw/vibex
npx playwright test tests/canvas-quick-generate.spec.ts --config=vibex-fronted-test.config.cjs
```

### 4.3 手动测试检查表

| # | 操作 | 预期结果 | 状态 |
|---|------|----------|------|
| 1 | 打开 Canvas，不输入内容，按 `Ctrl+G` | 显示「请先输入需求」warning toast | ☐ |
| 2 | 输入需求，按 `Ctrl+G` | 三树依次生成，成功 toast | ☐ |
| 3 | 生成中再次按 `Ctrl+G` | 静默忽略，不重复触发 | ☐ |
| 4 | API 失败时（mock） | 显示 error toast | ☐ |
| 5 | 按 `?` 打开快捷键面板 | 面板显示「Ctrl+G: 快速生成」 | ☐ |

---

## 5. 风险分析

### 5.1 风险登记表

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| **API 失败级联** | 中 | 高 | 每个 API 调用包裹 try/catch，失败时显示 toast，不阻断用户操作；`finally` 确保 `setIsGenerating(false)` |
| **Context 节点为 0 导致后续失败** | 低 | 中 | 第一步生成后检查 `contextNodes.length > 0`，否则抛出明确错误 |
| **useCallback 依赖遗漏** | 中 | 中 | 严格列出所有依赖：`requirementText`, `isGenerating`, `generateContextsFromRequirement`, `autoGenerateFlows`, `generateComponentFromFlow`, `showToast` |
| **Mac Cmd+G 与浏览器快捷键冲突** | 低 | 低 | 同时检测 `ctrlKey` 和 `metaKey`（见 Architecture Diagram） |
| **生成中刷新页面导致状态不一致** | 低 | 低 | 页面刷新后 `isGenerating` 重置为 false；现有 API 为幂等性操作 |

### 5.2 API 失败级联缓解（详细）

```typescript
const quickGenerate = useCallback(async () => {
  if (!requirementText.trim()) {
    showToast('请先输入需求', 'warning');
    return;
  }
  if (isGenerating) return;

  setIsGenerating(true);
  try {
    // Step 1
    const contextNodes = await generateContextsFromRequirement(requirementText);
    if (contextNodes.length === 0) {
      throw new Error('未生成任何 Context 节点，请检查需求输入');
    }

    // Step 2
    await autoGenerateFlows(contextNodes);

    // Step 3
    await generateComponentFromFlow();

    showToast('三树生成完成', 'success');
  } catch (error) {
    showToast(error instanceof Error ? error.message : '生成失败', 'error');
  } finally {
    setIsGenerating(false);
  }
}, [requirementText, isGenerating, generateContextsFromRequirement, autoGenerateFlows, generateComponentFromFlow, showToast]);
```

---

## 6. 验收标准汇总

| Story | 验收标准 | 测试方法 |
|-------|----------|----------|
| E1-S1 | `Ctrl+G` 在 Canvas 页面可触发 | Playwright `keyboard.press('Control+g')` |
| E1-S2 | 空输入显示「请先输入需求」toast | `expect(toastText).toContain('请先输入需求')` |
| E1-S3 | 三树依次生成，失败有 toast | `expect(contextCount > 0 && flowCount > 0 && componentCount > 0)` |

| Feature | 验收标准 | 测试方法 |
|---------|----------|----------|
| F1.1 | `Ctrl+G` 绑定成功 | 键盘事件触发 |
| F1.2 | 空输入检测 + warning toast | `toastText.includes('请先输入需求')` |
| F1.3 | 三树级联生成 | 节点计数 > 0 |
| F1.4 | `isGenerating` 阻止重复 | 重复触发后节点数量不翻倍 |
| F1.5 | 错误处理 toast | `toastType === 'error'` |
| F1.6 | ShortcutHint 显示 Ctrl+G | 面板文本包含 `Ctrl+G` |

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: canvas-quick-generate-command
- **执行日期**: 2026-04-01
