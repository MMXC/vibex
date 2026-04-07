# Storybook 环境搭建 PRD

**项目**: vibex-storybook-setup  
**版本**: 1.0  
**日期**: 2026-03-06  
**状态**: Draft

---

## 1. Problem Statement

项目有 25+ UI 组件，但缺少统一的组件文档和开发环境。需要建立 Storybook 环境，支持组件隔离开发、视觉文档和交互式演示。

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Storybook 8.x 环境搭建完成
- P0 组件有完整 Stories
- 每个功能有验收标准

### 2.2 Non-Goals
- 不修改组件实现代码
- 不添加新组件

---

## 3. Priority Matrix (优先级矩阵)

### 3.1 功能优先级

| ID | 功能 | 优先级 | 占比 |
|----|------|--------|------|
| S-01 | Storybook 基础配置 | P0 | 10% |
| S-02 | Button 组件 Story | P0 | 8% |
| S-03 | Input 组件 Story | P0 | 8% |
| S-04 | Alert 组件 Story | P0 | 8% |
| S-05 | Badge 组件 Story | P0 | 8% |
| S-06 | Modal 组件 Story | P0 | 8% |
| S-07 | Select 组件 Story | P0 | 8% |
| S-08 | Tabs 组件 Story | P0 | 8% |
| S-09 | Avatar 组件 Story | P0 | 8% |
| S-10 | Loading 组件 Story | P1 | 5% |
| S-11 | Toast 组件 Story | P1 | 5% |
| S-12 | Card 组件 Story | P1 | 5% |
| S-13 | Skeleton 组件 Story | P1 | 5% |
| S-14 | Form 组件 Story | P1 | 5% |
| S-15 | Field 组件 Story | P1 | 5% |
| S-16 | Grid 组件 Story | P2 | 4% |
| S-17 | 其他组件 Story | P2 | 4% |

### 3.2 P0 占比计算

| 类别 | 数量 |
|------|------|
| P0 功能 | 9 |
| 总功能 | 17 |
| **P0 占比** | **52.9%** (需调整) |

### 3.3 调整后优先级

| ID | 功能 | 优先级 | 占比 |
|----|------|--------|------|
| S-01 | Storybook 基础配置 | P0 | 10% |
| S-02 | Button 组件 Story | P0 | 8% |
| S-03 | Input 组件 Story | P0 | 8% |
| S-04 | Alert 组件 Story | P0 | 8% |
| S-05 | Modal 组件 Story | P0 | 8% |
| S-06 | Select 组件 Story | P1 | 6% |
| S-07 | Badge 组件 Story | P1 | 6% |
| S-08 | Tabs 组件 Story | P1 | 6% |
| S-09 | Avatar 组件 Story | P1 | 6% |
| S-10 | Loading 组件 Story | P1 | 5% |
| S-11 | Toast 组件 Story | P1 | 5% |
| S-12 | Card 组件 Story | P2 | 4% |
| S-13 | Skeleton 组件 Story | P2 | 4% |
| S-14 | Form 组件 Story | P2 | 4% |
| S-15 | Field 组件 Story | P2 | 4% |
| S-16 | Grid 组件 Story | P2 | 4% |
| S-17 | 其他组件 Story | P2 | 4% |
| S-18 | Addons 配置 | P2 | 4% |
| S-19 | 主题配置 | P2 | 4% |

**P0 占比**: 5/19 = **26.3%** ✅ (< 30%)

---

## 4. Acceptance Criteria (验收标准)

### 4.1 S-01: Storybook 基础配置

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-01 | Storybook 8.x 安装成功 | `npm run storybook` 启动 |
| AC-02 | 配置文件创建 | `.storybook/main.ts` 存在 |
| AC-03 | 全局装饰器配置 | `.storybook/preview.ts` 存在 |

### 4.2 S-02: Button 组件 Story

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-04 | Primary/Secondary/Danger 变体 | 视觉检查 |
| AC-05 | size 属性 Controls | Controls 面板测试 |
| AC-06 | disabled 状态 | Story 显示正确 |

### 4.3 S-03: Input 组件 Story

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-07 | 默认/禁用状态 | 视觉检查 |
| AC-08 | error 状态 | 视觉检查 |
| AC-09 | placeholder 控制 | Controls 测试 |

### 4.4 S-04: Alert 组件 Story

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-10 | info/success/warning/error 类型 | 视觉检查 |
| AC-11 | 可关闭 Alert | 交互测试 |

### 4.5 S-05: Modal 组件 Story

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-12 | 打开/关闭动画 | 交互测试 |
| AC-13 | 遮罩层点击关闭 | 交互测试 |

### 4.6 Addons 配置

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-14 | a11y addon 工作 | 运行 a11y 检查 |
| AC-15 | themes addon 工作 | 主题切换测试 |

---

## 5. Implementation Plan

### 5.1 阶段 1: 基础配置 (1h)

```bash
# 安装 Storybook
npx storybook@latest init

# 创建配置文件
.storybook/main.ts
.storybook/preview.ts
```

### 5.2 阶段 2: P0 组件 Stories (3h)

| 组件 | 时间 |
|------|------|
| Button | 30 min |
| Input | 30 min |
| Alert | 30 min |
| Modal | 1h |
| 配置/文档 | 30 min |

### 5.3 阶段 3: P1 组件 Stories (2h)

- Select, Badge, Tabs, Avatar
- Loading, Toast

### 5.4 阶段 4: Addons 和主题 (1h)

- a11y addon
- themes addon

---

## 6. Definition of Done (DoD)

### 6.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | Storybook 8.x 正常启动 |
| DoD-2 | P0 组件 (Button/Input/Alert/Modal) Stories 完成 |
| DoD-3 | 每个组件有至少 3 个 Story 变体 |
| DoD-4 | Controls 面板可交互 |
| DoD-5 | 暗色主题配置完成 |
| DoD-6 | a11y addon 集成完成 |

### 6.2 质量 DoD

| # | 条件 |
|---|------|
| DoD-7 | npm run storybook 无报错 |
| DoD-8 | npm run build-storybook 成功 |
| DoD-9 | Story 文件符合规范 |

### 6.3 回归测试

| 场景 | 预期 |
|------|------|
| 组件 Story 加载 | 正常显示 |
| Controls 交互 | 参数更新正确 |
| 主题切换 | 样式变化正确 |

---

## 7. Timeline Estimate

| 阶段 | 工作量 |
|------|--------|
| 基础配置 | 1h |
| P0 组件 | 3h |
| P1 组件 | 2h |
| Addons | 1h |
| 验证测试 | 1h |
| **总计** | **8h** |

---

## 8. Dependencies

- **前置**: analyze-storybook-requirements (已完成)
- **依赖**: Node.js, React, Next.js

---

*PRD 完成于 2026-03-06 (PM Agent)*
