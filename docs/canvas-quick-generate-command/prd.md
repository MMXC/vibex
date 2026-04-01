# PRD: canvas-quick-generate-command — Canvas 快速生成命令

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

用户当前需要手动一步步操作才能完成三树（Context → Flow → Component）生成：先输入需求生成 Context，再生成 Flow，最后生成 Component。无快捷方式一键触发完整流程。

### 目标

实现 `Ctrl+G` 快捷键，一键触发完整的三树生成流程（自动级联 Context → Flow → Component）。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 快捷键响应 | < 100ms | E2E 按键到触发 |
| 生成成功率 | ≥ 90% | 有效需求输入 + 正常 API |
| 流程完成率 | 100% | Context → Flow → Component 全部生成 |

---

## 2. Epic 拆分

### Epic 1: Ctrl+G 快速生成命令

**工时**: 2h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E1-S1 | 快捷键绑定 | 0.5h | CanvasPage 绑定 `Ctrl+G` 监听 |
| E1-S2 | 三树级联生成 | 1h | 依次调用 generateContexts → autoGenerateFlows → generateComponent |
| E1-S3 | 错误处理 + Toast | 0.5h | 空输入/生成中/失败各有对应提示 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Ctrl+G 绑定 | ShortcutHintPanel + CanvasPage 监听键盘事件 | `expect(isCtrlGBound).toBe(true)` | 【需页面集成】 |
| F1.2 | 空输入检测 | 无需求时按 Ctrl+G 显示 toast | `expect(toastMessage).toContain('请先输入需求')` | 【需页面集成】 |
| F1.3 | 三树级联 | 依次调用 generateContexts → autoGenerateFlows → generateComponent | `expect(contextCount).toBeGreaterThan(0)` | 【需页面集成】 |
| F1.4 | 生成中状态 | 生成中再次按 Ctrl+G 忽略或显示「生成中...」 | `expect(secondTriggerIgnored).toBe(true)` | 【需页面集成】 |
| F1.5 | 错误处理 | 生成失败显示 toast 错误，不阻断操作 | `expect(toastType).toBe('error')` | 【需页面集成】 |
| F1.6 | ShortcutHint 提示 | ShortcutHintPanel 显示 Ctrl+G 说明 | `expect(hintText).toContain('Ctrl+G')` | 【需页面集成】 |

#### DoD

- [ ] `Ctrl+G` 快捷键在 Canvas 页面可触发
- [ ] 有需求输入时自动级联生成 Context → Flow → Component
- [ ] 无需求输入时显示「请先输入需求」toast
- [ ] 生成中状态阻止重复触发
- [ ] 失败时显示错误 toast
- [ ] Playwright E2E 覆盖 Ctrl+G 场景

---

## 3. 验收标准（汇总）

| Story | expect() 断言 |
|-------|--------------|
| F1.1 | `expect(keyListenerRegistered).toBe(true)` |
| F1.2 | `expect(emptyInputToastShown).toBe(true)` |
| F1.3 | `expect(contextCount).toBeGreaterThan(0) && expect(flowCount).toBeGreaterThan(0) && expect(componentCount).toBeGreaterThan(0)` |
| F1.4 | `expect(repeatTriggerIgnored).toBe(true)` |
| F1.5 | `expect(errorToastShown).toBe(true)` |
| F1.6 | `expect(shortcutHintExists).toBe(true)` |

---

## 4. DoD

### 全局 DoD

1. **快捷键绑定**: `Ctrl+G` 在 Canvas 页面可响应
2. **级联生成**: Context → Flow → Component 自动完成
3. **错误处理**: 空输入/生成中/失败各有 toast 提示
4. **ShortcutHint 更新**: 显示 Ctrl+G 说明

### 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | Ctrl+G 可触发三树生成；E2E 测试覆盖 |

---

## 5. 技术方案

**推荐方案（方案 A）**：

```typescript
// CanvasPage.tsx
const quickGenerate = useCallback(async () => {
  if (!requirementText.trim()) {
    showToast('请先输入需求', 'warning');
    return;
  }
  
  if (isGenerating) return; // 阻止重复触发
  
  setIsGenerating(true);
  
  try {
    // Step 1: Generate Contexts
    const contextNodes = await generateContexts(requirementText);
    if (contextNodes.length === 0) {
      throw new Error('未生成任何 Context 节点');
    }
    
    // Step 2: Auto Generate Flows
    const flowNodes = await autoGenerateFlows(contextNodes);
    
    // Step 3: Generate Components
    const componentNodes = await generateComponentFromFlow();
    
    showToast('三树生成完成', 'success');
  } catch (error) {
    showToast(error.message || '生成失败', 'error');
  } finally {
    setIsGenerating(false);
  }
}, [requirementText, isGenerating, ...]);
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| **响应速度** | 快捷键响应 < 100ms |
| **可靠性** | 生成成功率 ≥ 90%（有效输入 + 正常 API） |
| **用户体验** | 每步骤有 toast 提示，不让用户困惑 |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 17:06 GMT+8*
