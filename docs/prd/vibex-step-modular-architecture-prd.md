# PRD: 首页步骤组件模块化重构

**项目**: vibex-step-modular-architecture
**版本**: 1.0
**日期**: 2026-03-17
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

HomePage.tsx 目前是 530 行单体组件，包含所有 5 个步骤的逻辑，测试难度高，维护困难。

### 目标

将 HomePage.tsx 拆分为 5 个独立步骤组件，实现模块化架构。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 步骤组件数 | 5 个 |
| HomePage.tsx 行数 | < 100 行 |
| 单步骤可测试性 | 100% |

---

## 2. 功能需求

### F1: 步骤组件拆分

**描述**: 创建 5 个独立步骤组件

**验收标准**:
- AC1.1: `StepRequirementInput.tsx` 组件存在且可渲染
- AC1.2: `StepBoundedContext.tsx` 组件存在且可渲染
- AC1.3: `StepDomainModel.tsx` 组件存在且可渲染
- AC1.4: `StepBusinessFlow.tsx` 组件存在且可渲染
- AC1.5: `StepProjectCreate.tsx` 组件存在且可渲染
- AC1.6: 每个组件导出为独立模块

### F2: StepContainer 容器

**描述**: 容器组件按 currentStep 渲染对应步骤

**验收标准**:
- AC2.1: `StepContainer` 根据 `currentStep` 渲染正确组件
- AC2.2: 支持懒加载 `lazy()`
- AC2.3: 有 Loading 状态 `Suspense`

### F3: 状态管理集成

**描述**: 步骤组件使用 Zustand Store

**验收标准**:
- AC3.1: 组件从 `confirmationStore` 获取数据
- AC3.2: 组件可更新 Store 状态
- AC3.3: 状态同步无延迟

### F4: HomePage 简化

**描述**: HomePage.tsx 简化为容器

**验收标准**:
- AC4.1: HomePage.tsx 行数 < 100
- AC4.2: 仅包含 StepContainer + Sidebar + Navbar
- AC4.3: 无步骤逻辑代码

---

## 3. Epic 拆分

### Epic 1: 步骤组件开发

**负责人**: Dev | **预估**: 8h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S1.1 | 创建 `steps/` 目录结构 | expect(fs.existsSync('steps/')).toBe(true) |
| S1.2 | 实现 StepRequirementInput | expect(render(<StepRequirementInput />)).toBeTruthy() |
| S1.3 | 实现 StepBoundedContext | expect(render(<StepBoundedContext />)).toBeTruthy() |
| S1.4 | 实现 StepDomainModel | expect(render(<StepDomainModel />)).toBeTruthy() |
| S1.5 | 实现 StepBusinessFlow | expect(render(<StepBusinessFlow />)).toBeTruthy() |
| S1.6 | 实现 StepProjectCreate | expect(render(<StepProjectCreate />)).toBeTruthy() |

---

### Epic 2: StepContainer 容器

**负责人**: Dev | **预估**: 2h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S2.1 | 实现 StepContainer 组件 | expect(container.currentStep).toRender(1) |
| S2.2 | 实现懒加载逻辑 | expect(lazy).toBeDefined() |
| S2.3 | 实现 Suspense 包裹 | expect(suspense).toShowFallback() |

---

### Epic 3: HomePage 简化

**负责人**: Dev | **预估**: 2h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S3.1 | 简化 HomePage.tsx | expect(lineCount).toBeLessThan(100) |
| S3.2 | 移除步骤逻辑代码 | expect(homePage).not.toContain('currentStep ===') |

---

### Epic 4: 测试验证

**负责人**: Tester | **预估**: 3h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S4.1 | 单步骤单元测试 | expect(stepTest).toPass() |
| S4.2 | 步骤导航集成测试 | expect(navigation).toWork() |
| S4.3 | 回归测试 | expect(regression).toPass() |

---

## 4. 组件接口设计

### 4.1 StepRequirementInput

```tsx
interface StepRequirementInputProps {
  requirementText: string;
  onNavigate: (step: number) => void;
  // 【需页面集成】
}
```

### 4.2 StepBoundedContext

```tsx
interface StepBoundedContextProps {
  boundedContexts: BoundedContext[];
  selectedContextIds: Set<string>;
  onNavigate: (step: number) => void;
  // 【需页面集成】
}
```

---

## 5. 实施计划

| 阶段 | 任务 | 预估 |
|------|------|------|
| Phase 1 | 创建目录结构 | 2h |
| Phase 2 | 实现 5 个步骤组件 | 8h |
| Phase 3 | StepContainer 容器 | 2h |
| Phase 4 | HomePage 简化 | 2h |
| Phase 5 | 测试验证 | 3h |

**总计**: 17h ≈ 2.5 人日

---

## 6. 验收 CheckList

- [ ] AC1.1: StepRequirementInput 存在
- [ ] AC1.2: StepBoundedContext 存在
- [ ] AC1.3: StepDomainModel 存在
- [ ] AC1.4: StepBusinessFlow 存在
- [ ] AC1.5: StepProjectCreate 存在
- [ ] AC2.1: StepContainer 按步骤渲染
- [ ] AC2.2: 懒加载支持
- [ ] AC2.3: Suspense Loading
- [ ] AC3.1: Store 数据获取
- [ ] AC3.2: Store 状态更新
- [ ] AC4.1: HomePage < 100 行
- [ ] AC4.2: 简化结构
- [ ] AC4.3: 无步骤逻辑

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 状态同步延迟 | 中 | 高 | 使用 Zustand selector |
| 样式冲突 | 低 | 低 | CSS Module 隔离 |
| 懒加载闪烁 | 低 | 中 | 添加 Loading 骨架屏 |

---

**DoD (Definition of Done)**:
1. 5 个步骤组件独立存在
2. 单步骤单元测试通过
3. HomePage.tsx < 100 行
4. 回归测试通过
5. 代码合并到 main 分支
