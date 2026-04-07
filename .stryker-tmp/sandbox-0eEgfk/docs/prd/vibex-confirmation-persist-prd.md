# 确认流程进度持久化 PRD

**项目**: vibex-confirmation-persist  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

确认流程使用 Zustand + persist 中间件，已有 localStorage 配置，但存在以下问题：
- 无版本控制，数据结构变更无法迁移
- 无恢复对话框，用户体验不完整
- 关闭页面后重新打开无法恢复进度

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 版本迁移策略明确
- 恢复对话框交互设计
- 关闭页面重新打开后恢复进度

### 2.2 Non-Goals
- 不修改业务逻辑
- 不添加新功能

---

## 3. Version Migration Strategy

### 3.1 版本号定义

```typescript
const STORAGE_VERSION = 1;
const STORAGE_KEY = 'vibex-confirmation-flow';
```

### 3.2 迁移函数

```typescript
migrate: (persistedState: any, fromVersion: number) => {
  if (fromVersion < 1) {
    // v0 -> v1: 添加新字段默认值
    return {
      ...persistedState,
      // 新字段
    };
  }
  return persistedState;
}
```

### 3.3 未来版本迁移

| 版本 | 迁移内容 | 预估工作量 |
|-----|---------|-----------|
| v1->v2 | 新增字段 | 0.5h |
| v2->v3 | 结构调整 | 0.5h |

---

## 4. Restore Dialog Design

### 4.1 触发条件

- 页面加载时
- `currentStep !== 'input'` 且 `requirementText` 存在

### 4.2 交互流程

```
页面加载
    ↓
检查是否有可恢复数据
    ↓
有数据? → 显示恢复对话框 → 用户选择
    ↓                         ↓
继续           重新开始
    ↓                         ↓
导航到保存步骤     清除状态
```

### 4.3 对话框设计

```tsx
// 恢复对话框 UI
<div className="restore-dialog-overlay">
  <div className="restore-dialog">
    <h2>继续未完成的流程？</h2>
    <p>您在上次离开时的步骤：{currentStep}</p>
    <p>需求文本：{previewText}</p>
    <div className="actions">
      <button onClick={handleRestore}>继续</button>
      <button onClick={handleReset}>重新开始</button>
    </div>
  </div>
</div>
```

### 4.4 按钮文案

| 按钮 | 文案 | 动作 |
|-----|------|------|
| 继续 | "继续" | 保持状态，导航到保存步骤 |
| 重新开始 | "重新开始" | 清除 localStorage，重置状态 |

---

## 5. Partialize Configuration

### 5.1 需要持久化的字段

```typescript
partialize: (state: ConfirmationFlowState) => ({
  currentStep: state.currentStep,
  requirementText: state.requirementText,
  boundedContexts: state.boundedContexts,
  selectedContextIds: state.selectedContextIds,
  contextMermaidCode: state.contextMermaidCode,
  domainModels: state.domainModels,
  modelMermaidCode: state.modelMermaidCode,
  businessFlow: state.businessFlow,
  flowMermaidCode: state.flowMermaidCode,
  createdProjectId: state.createdProjectId,
})
```

### 5.2 不持久化的字段

| 字段 | 原因 |
|-----|------|
| history | 数据过大，影响性能 |
| historyIndex | 依赖 history |

---

## 6. Implementation Steps

### 步骤 1: 更新 Zustand persist 配置

- 添加 `version: 1`
- 添加 `migrate` 函数
- 添加 `partialize` 配置

### 步骤 2: 创建恢复对话框组件

- 检测可恢复数据
- 显示对话框
- 处理用户选择

### 步骤 3: 实现清理机制

- 成功创建项目后清理
- 用户手动清理选项

---

## 7. Acceptance Criteria (验收标准)

### 7.1 版本迁移

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-01 | 版本号为 1 | 检查代码 |
| AC-02 | migrate 函数正确执行 | 模拟旧版本数据 |
| AC-03 | 迁移后数据完整 | 检查状态树 |

### 7.2 恢复对话框

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-04 | 有可恢复数据时显示对话框 | 手动测试 |
| AC-05 | 点击"继续"导航到正确步骤 | 手动测试 |
| AC-06 | 点击"重新开始"清除状态 | 手动测试 |
| AC-07 | 无可恢复数据时不显示 | 手动测试 |

### 7.3 持久化验证

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-08 | 刷新页面后状态保持 | F5 刷新 |
| AC-09 | 关闭浏览器后重新打开恢复 | 关闭重开 |
| AC-10 | 创建项目成功后清理存储 | 检查 localStorage |

---

## 8. Definition of Done (DoD)

### 8.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | Zustand persist 版本配置为 1 |
| DoD-2 | migrate 函数处理 v0->v1 迁移 |
| DoD-3 | 恢复对话框正确显示 |
| DoD-4 | 点击"继续"正确恢复进度 |
| DoD-5 | 点击"重新开始"清除状态 |
| DoD-6 | 关闭页面重新打开后恢复进度 |
| DoD-7 | 创建项目成功后清理存储 |

### 8.2 回归测试

| 场景 | 预期 |
|------|------|
| 页面刷新 | 状态保持 |
| 关闭浏览器重开 | 状态恢复 |
| 对话框选择继续 | 导航到正确步骤 |
| 对话框选择重新开始 | 状态清除 |

---

## 9. Timeline Estimate

| 阶段 | 工作量 |
|------|--------|
| 更新 Zustand 配置 | 1h |
| 创建恢复对话框 | 1h |
| 清理机制 | 0.5h |
| 验证测试 | 0.5h |
| **总计** | **3h** |

---

## 10. Dependencies

- **前置**: analyze-persist-needs (已完成)
- **依赖**: Zustand persist 中间件

---

*PRD 完成于 2026-03-05 (PM Agent)*
