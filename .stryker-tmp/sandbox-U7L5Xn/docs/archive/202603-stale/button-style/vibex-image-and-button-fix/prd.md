# PRD: 图片渲染和按钮修复

**项目**: vibex-image-and-button-fix
**产品经理**: PM Agent
**日期**: 2026-03-17
**版本**: 1.0
**状态**: Done
**优先级**: P0

---

## 1. 执行摘要

### 1.1 背景

首页 Step 1 存在两个 UI 问题：
1. 图片未渲染：预览区显示占位符而非限界上下文图
2. 按钮行为不符：用户预期与实际行为不一致

### 1.2 目标

| 问题 | 当前值 | 目标值 |
|------|--------|--------|
| Step 1 图表显示 | 空占位符 | 显示限界上下文图 |
| 按钮行为 | 不一致 | 符合用户预期 |

### 1.3 预估工时

0.5 天

---

## 2. 功能需求

### F1: currentMermaidCode 逻辑修复

**描述**: 修复 HomePage.tsx 中 currentMermaidCode 逻辑，Step 1 也显示 contextMermaidCode【需页面集成】

**验收标准**:
- [ ] F1.1: Step 1 有 contextMermaidCode 时显示图表 (expect(preview shows diagram on step 1))
- [ ] F1.2: Step 2-4 行为保持不变 (expect(steps 2-4 unchanged))
- [ ] F1.3: 无 mermaidCode 时显示占位符 (expect(placeholder when empty))

### F2: 步骤自动跳转

**描述**: 生成完成后自动跳转到 Step 2【需页面集成】

**验收标准**:
- [ ] F2.1: 生成完成后自动设置 completedStep=2 (expect(completedStep updated to 2))
- [ ] F2.2: 生成完成后自动设置 currentStep=2 (expect(currentStep advances to 2))
- [ ] F2.3: 生成过程中显示 loading 状态 (expect(loading state shown))

### F3: 按钮文案更新

**描述**: Step 1 按钮显示更准确的文案

**验收标准**:
- [ ] F3.1: Step 1 按钮显示"分析需求" (expect(button shows "分析需求"))
- [ ] F3.2: Step 2-4 按钮保持原有文案 (expect(other steps unchanged))

---

## 3. Epic 拆分

| Epic ID | 名称 | 工作量 | 负责人 |
|---------|------|--------|--------|
| E-001 | currentMermaidCode 修复 | 0.5h | Dev |
| E-002 | 自动跳转实现 | 1h | Dev |
| E-003 | 测试验证 | 0.5h | Tester |

**总工作量**: 2 小时

---

## 4. 验收标准

### 4.1 成功标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC-001 | Step 1 显示限界上下文图 | E2E 测试 |
| AC-002 | 生成完成后自动跳转 | 手动测试 |
| AC-003 | 按钮文案正确 | 视觉检查 |

### 4.2 DoD

- [ ] 现有测试全部通过
- [ ] 无控制台错误
- [ ] 代码审查通过

---

## 5. 约束条件

- ❌ 不修改 API 接口
- ✅ 保持现有测试通过
- ✅ 仅修改 HomePage.tsx 和相关 hooks
