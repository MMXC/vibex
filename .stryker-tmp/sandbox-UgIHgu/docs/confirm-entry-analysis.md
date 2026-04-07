# 确认流程入口分析

## 项目
vibex-confirm-entry-unify

## 1. 现有确认流程入口

| 入口路径 | 来源页面 | 功能 |
|---------|---------|------|
| `/confirm` | Dashboard | 需求输入 (Step 1) |
| `/confirm/context` | `/confirm` | 限界上下文确认 (Step 2) |
| `/confirm/model` | Domain 页面 | 领域模型确认 (Step 3) |
| `/confirm/flow` | `/confirm/model` | 业务流程确认 (Step 4) |
| `/confirm/success` | `/confirm/flow` | 完成页 |

## 2. 问题识别

### 问题 1: 入口重复
- `/confirm` 和 `/confirm/context` 都提供 Step 1 功能（需求输入/确认）
- 用户困惑：两个入口功能有何不同？

### 问题 2: 入口绕过
- `/confirm/model` 可以从 domain 页面直接跳入
- 用户可以绕过 Step 1, Step 2 直接到 Step 3
- 数据状态可能不一致

### 问题 3: 用户旅程不清晰
- 用户可以从任意一步进入
- 缺少统一的入口引导
- 没有入口校验（检查前置步骤是否完成）

## 3. 统一入口方案

### 方案 A: 单一入口 + 步骤引导
- 统一入口：`/confirm`
- 使用 URL 参数或查询参数区分：`/confirm?step=context`
- 在入口处检查前置步骤状态，不允许跳过

### 方案 B: 入口分流 + 状态校验
- `/confirm` 作为主入口
- 其他入口添加状态校验，无效状态重定向到主入口
- 保留现有路由结构，但添加保护逻辑

## 4. 用户旅程图

```mermaid
graph TD
    A[用户: 访问系统] --> B[Dashboard]
    
    B --> C[点击确认流程入口]
    C --> D{选择入口}
    
    D --> E1[/confirm - 需求输入]
    D --> E2[/confirm/model - 领域模型]
    
    E1 --> F1[Step 1: 需求输入]
    F1 --> F2[Step 2: 限界上下文]
    F2 --> F3[Step 3: 领域模型]
    F3 --> F4[Step 4: 业务流程]
    F4 --> G[完成]
    
    E2 --> H{状态校验}
    H -->|无前置数据| F1
    H -->|有前置数据| F3
    
    style D fill:#ff9999
    style H fill:#ff9999
```

### 现状问题：
- 虚线框表示的 D（入口选择）和 H（状态校验）目前不存在
- 用户可以绕过中间步骤

### 优化后：
- 添加统一入口引导
- 添加状态校验保护
- 用户旅程清晰可见

## 5. 约束检查

| 约束 | 状态 |
|------|------|
| 保持现有确认流程功能 | ✅ 兼容现有所有页面 |
| 不增加用户操作步骤 | ✅ 入口统一，操作步骤不变 |
| 输出用户旅程图 | ✅ 已在本文档中输出 |

## 6. 验证

```bash
test -f docs/confirm-entry-analysis.md
```

## 7. 建议实施

推荐 **方案 B**：保留现有路由结构，添加入口校验和引导逻辑，改动最小化。

具体实施：
1. 在 `/confirm/model`, `/confirm/flow` 页面添加状态校验
2. 无有效状态时重定向到 `/confirm`
3. 在 Dashboard 添加清晰的入口引导
