# Analysis: Canvas Quick Generate Command Feasibility

**Agent**: analyst
**日期**: 2026-04-01
**项目**: canvas-quick-generate-command

---

## 1. 问题定义

**需求**: 实现 Canvas 快速生成命令功能，通过快捷键/命令快速触发三树（Context → Flow → Component）自动生成流程。

**用户场景**:
- 用户在 Canvas 中输入需求文本
- 按下快捷键（如 `Ctrl+Enter`）快速触发生成
- 自动完成：Context 节点 → Flow 流程 → Component 组件

**JTBD**: 「作为用户，我希望一键触发完整的三树生成流程，不再需要一步步手动操作」

---

## 2. 现有能力分析

### 2.1 已实现的 API 方法

| 方法 | 位置 | 功能 |
|------|------|------|
| `generateContextsFromRequirement(text)` | canvasStore.ts L427 | 从需求文本生成 Context 节点 |
| `autoGenerateFlows(contexts[])` | canvasStore.ts L894 | 从 Context 生成 Flow 节点 |
| `generateComponentFromFlow()` | canvasStore.ts L948 | 从 Flow 生成 Component 节点 |

### 2.2 三树生成链路

```
用户输入需求 → generateContextsFromRequirement() 
                    ↓
              Context 节点 (bounded contexts)
                    ↓
              autoGenerateFlows(contexts)
                    ↓
              Flow 节点 (business flows)
                    ↓
              generateComponentFromFlow()
                    ↓
              Component 节点 (React components)
```

### 2.3 现有快捷键

ShortcutHintPanel 定义了现有快捷键：
- `Ctrl+Z/Y` - 撤销/重做
- `Ctrl+K` - 搜索节点
- `N` - 新建节点
- `F11` - 最大化画布
- `?` - 快捷键提示

**缺失**: 无快速生成快捷键

---

## 3. 技术可行性分析

### 3.1 方案设计

#### 方案 A：快捷键触发 + 自动级联（P0 — 推荐）

**设计**:
1. 绑定快捷键 `Ctrl+G`（G = Generate）
2. 检测当前需求输入框是否有内容
3. 依次调用：generateContexts → autoGenerateFlows → generateComponent
4. 完成后显示成功提示 + 自动展示结果

```typescript
// CanvasPage.tsx 新增
const quickGenerate = useCallback(async () => {
  if (!requirementText.trim()) {
    showToast('请先输入需求', 'warning');
    return;
  }
  
  // Step 1: Generate Contexts
  await generateContexts(requirementText);
  
  // Step 2: Auto Generate Flows (等待 Context 确认)
  await autoGenerateFlows(contextNodes);
  
  // Step 3: Generate Components (等待 Flow 确认)
  await generateComponentFromFlow();
  
  showToast('三树生成完成', 'success');
}, [requirementText, contextNodes, flowNodes]);
```

**优点**:
- 覆盖完整三树生成流程
- 用户体验佳（一键完成）

**工时**: 2h

---

#### 方案 B：分步快捷键

**设计**: 每个阶段单独快捷键
- `Ctrl+1` - 生成 Context
- `Ctrl+2` - 生成 Flow
- `Ctrl+3` - 生成 Component

**优点**:
- 灵活控制每一步

**缺点**:
- 需要 3 次按键，用户操作多

**工时**: 1.5h

---

#### 方案 C：命令面板（输入 "/" 触发）

**设计**:
- 类似 Slack 命令面板
- 输入 `/generate` 触发生成

**优点**:
- 可扩展其他命令

**缺点**:
- 改动较大（需新建命令面板组件）

**工时**: 4h

---

### 3.2 推荐方案

**方案 A**（快捷键 `Ctrl+G` + 自动级联）作为 P0 实现。

**理由**:
1. 用户体验最佳（一键完成）
2. 现有 API 已完整（无需新增接口）
3. 改动可控（仅 CanvasPage + ShortcutHintPanel）
4. 2h 可完成

---

## 4. 依赖与风险

### 4.1 依赖

| 依赖 | 状态 | 说明 |
|------|------|------|
| generateContextsFromRequirement | ✅ 已实现 | canvasStore.ts L427 |
| autoGenerateFlows | ✅ 已实现 | canvasStore.ts L894 |
| generateComponentFromFlow | ✅ 已实现 | canvasStore.ts L948 |
| 现有快捷键系统 | ✅ 已实现 | ShortcutHintPanel |

### 4.2 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| API 响应时间过长 | 中 | 用户等待焦虑 | 添加 loading 状态 + 进度提示 |
| 生成失败无回退 | 低 | 状态不一致 | 每个 API 调用加 try-catch + toast 错误 |
| Context/Flow 节点为 0 | 中 | 后续无法生成 | 检测节点数 > 0 再继续 |

---

## 5. 验收标准

| 场景 | 预期行为 |
|------|----------|
| 输入需求 + Ctrl+G | 依次生成 Context → Flow → Component |
| 无需求输入 + Ctrl+G | 显示 toast：「请先输入需求」 |
| 生成中再次按 Ctrl+G | 忽略（或显示「生成中...」） |
| 生成失败 | 显示 toast 错误，不阻断其他操作 |

---

## 6. 实施路径

1. **Phase 1**: 在 ShortcutHintPanel 添加 `Ctrl+G` 说明
2. **Phase 2**: 在 CanvasPage 实现 `quickGenerate` 回调
3. **Phase 3**: 绑定键盘事件 + 测试
4. **Phase 4**: 添加错误处理 + toast 提示

**总工时**: 2h

---

## 7. 下一步

1. **确认方案**: 采用方案 A（Ctrl+G + 自动级联）
2. **派发开发**: `dev-canvas-quick-generate` → 实现功能
3. **测试验证**: 验证 Ctrl+G 生成完整三树