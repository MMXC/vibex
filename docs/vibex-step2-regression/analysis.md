# 分析报告：vibex-step2-regression

## 问题描述
vibex-step2-issues 引入的回归问题：
1. **UI组件分析点不了** - 需要进一步确认
2. **第一步的流程图不显示** - 首页流程不走 design

## 根因分析（重新）

### 核心问题：首页与 Design 页面数据不同步

**Store 分离**：
| Store | 用途 | 数据 |
|-------|------|------|
| confirmationStore | 首页 | boundedContexts, domainModels, businessFlow |
| designStore | /design/* 页面 | boundedContexts, businessFlows |

**问题**：
- 首页生成的 DDD 数据存储在 confirmationStore
- Design 页面从 designStore 读取数据
- **两个 store 之间没有数据同步机制**

**影响**：
- Design 页面是空的，需要重新生成数据
- 用户期望首页流程完成后能跳转到 Design 页面并看到数据

### vibex-step2-issues 的改动
- `469bb207` 添加了 DesignStepLayout + StepNavigator 到所有 /design/* 页面
- 但没有添加从 confirmationStore 到 designStore 的数据同步

### Step 1 按钮问题
- `8b8eab0b` 把 `onGenerateFlow()` 改成 `onGenerateContexts()`
- 这是正确的改动（符合 DDD 流程）
- 但流程图不显示是因为 mermaidCode 更新逻辑问题

## 修复方案

### 方案：添加数据同步机制
1. 在首页完成时，将数据同步到 designStore
2. 或者在 Design 页面初始化时，从 confirmationStore 读取数据

### 影响范围
- `vibex-fronted/src/stores/confirmationStore.ts`
- `vibex-fronted/src/stores/designStore.ts`
- 首页或 Design 页面的初始化逻辑

## 验证方法
1. 首页输入需求，完成三步流程
2. 跳转到 /design/* 页面
3. 确认能看到首页生成的数据
