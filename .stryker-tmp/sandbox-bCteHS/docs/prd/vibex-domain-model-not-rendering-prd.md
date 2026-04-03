# PRD: 领域模型渲染功能修复

**项目**: vibex-domain-model-not-rendering
**版本**: 1.0
**日期**: 2026-03-16
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

用户点击「生成领域模型」后，API 返回正常但页面无变化，仍显示限界上下文图，无法切换到领域模型视图。

### 目标

修复领域模型生成后页面不更新的问题，实现 Mermaid 图表正确渲染。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 领域模型生成成功率 | ≥ 95% |
| 图表渲染成功率 | ≥ 90% |
| 页面切换时间 | < 2s |

---

## 2. 问题陈述

### 2.1 用户痛点

- 点击「生成领域模型」后无任何视觉反馈
- 页面停留在 Step 2，无法进入 Step 3 查看领域模型
- 预览区域显示空白

### 2.2 根因分析

| 环节 | 问题 | 影响 |
|------|------|------|
| Backend API | `/api/ddd/domain-model/stream` 未返回 `mermaidCode` | 前端无法获取图表代码 |
| Frontend Hook | `useDomainModelStream` 未定义 `mermaidCode` 状态 | 无法存储图表代码 |
| Frontend Component | `HomePage.tsx` 硬编码 `setModelMermaidCode('')` | 永远为空 |

---

## 3. 功能需求

### F1: Backend 返回 Mermaid 代码

**描述**: 在 `/api/ddd/domain-model/stream` 的 `done` 事件中返回 `mermaidCode`

**验收标准**:
- AC1.1: `done` 事件 payload 包含 `mermaidCode` 字段
- AC1.2: `mermaidCode` 为有效的 Mermaid 类图代码
- AC1.3: 对比 `bounded-context/stream` 保持一致的实现模式

### F2: Frontend Hook 支持 mermaidCode

**描述**: 在 `useDomainModelStream` hook 中添加 `mermaidCode` 状态

**验收标准**:
- AC2.1: Hook 返回值包含 `mermaidCode: string`
- AC2.2: SSE `done` 事件触发时正确设置 `mermaidCode`
- AC2.3: 状态重置时 `mermaidCode` 置空

### F3: HomePage 正确渲染图表

**描述**: HomePage 组件从 Hook 获取 mermaidCode 并渲染

**验收标准**:
- AC3.1: Step 3 正确显示领域模型类图
- AC3.2: `setModelMermaidCode()` 使用 Hook 返回值而非硬编码空字符串
- AC3.3: 页面切换动画流畅

### F4: 按钮禁用逻辑修复

**描述**: 修复按钮启用条件，必须选中上下文后才能点击

**验收标准**:
- AC4.1: 未选中任何上下文时按钮为 disabled 状态
- AC4.2: 选中至少一个上下文后按钮启用

---

## 4. Epic 拆分

### Epic 1: Backend Mermaid 代码返回

**负责人**: Dev

**Stories**:
- S1.1: 修改 `ddd.ts` Line 466-471，在 done 事件中添加 `mermaidCode`
- S1.2: 调用 `generateDomainModelMermaidCode()` 生成图表代码
- S1.3: 单元测试验证 API 返回结构

**验收标准**:
- expect(apiResponse.events[0].data).toHaveProperty('mermaidCode')
- expect(typeof apiResponse.events[0].data.mermaidCode).toBe('string')

---

### Epic 2: Frontend Hook 状态扩展

**负责人**: Dev

**Stories**:
- S2.1: 在 `useDDDStream.ts` 添加 `mermaidCode` 状态
- S2.2: 在 done 事件处理中设置 `mermaidCode`
- S2.3: 在返回值中包含 `mermaidCode`

**验收标准**:
- expect(useDomainModelStreamReturn).toHaveProperty('mermaidCode')
- expect(screen.getByTestId('mermaid-code')).toHaveTextContent(/classDiagram/)

---

### Epic 3: HomePage 组件集成

**负责人**: Dev

**Stories**:
- S3.1: 从 Hook 解构 `mermaidCode`
- S3.2: 修改 useEffect 使用 Hook 返回值
- S3.3: 验证 Step 3 渲染正确

**验收标准**:
- expect(currentStep).toBe(3) // 点击生成后
- expect(mermaidPreview).toBeVisible()

---

### Epic 4: 按钮禁用逻辑修复

**负责人**: Dev

**Stories**:
- S4.1: 修改按钮禁用条件为 `selectedContextIds.size > 0`
- S4.2: 添加单元测试验证禁用状态

**验收标准**:
- expect(button).toBeDisabled() // 未选中时
- expect(button).toBeEnabled() // 选中后

---

## 5. UI/UX 流程

```
用户进入 Step 2 (限界上下文)
    ↓
选择至少一个上下文
    ↓
点击「🚀 生成领域模型」按钮 (启用状态)
    ↓
显示思考面板 (流式输出)
    ↓
完成后自动切换到 Step 3
    ↓
预览区域显示领域模型类图 ✓
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | 页面切换 < 2s |
| 兼容性 | Chrome / Edge / Firefox 最新版本 |
| 可访问性 | 按钮有 aria-disabled 属性 |
| 错误处理 | API 异常时显示错误提示 |

---

## 7. 依赖项

| 依赖 | 说明 |
|------|------|
| `generateDomainModelMermaidCode()` | 需确认该函数已实现 (ddd.ts Line 540-549) |
| `useDDDStream` hook | 参考实现模式 |
| E2E 测试框架 | 用于验证完整流程 |

---

## 8. 实施计划

| 阶段 | 任务 | 预估工时 |
|------|------|----------|
| Phase 1 | Backend 修改 | 1h |
| Phase 2 | Frontend Hook 修改 | 1h |
| Phase 3 | HomePage 修改 | 1h |
| Phase 4 | 按钮逻辑修复 | 0.5h |
| Phase 5 | E2E 测试 | 1h |

**总计**: 4.5h

---

## 9. 验收 CheckList

- [ ] AC1.1: done 事件包含 mermaidCode
- [ ] AC1.2: mermaidCode 为有效 Mermaid 代码
- [ ] AC2.1: Hook 返回值包含 mermaidCode
- [ ] AC3.1: Step 3 正确显示类图
- [ ] AC4.1: 未选中时按钮禁用

---

**DoD (Definition of Done)**:
1. 代码合并到 main 分支
2. E2E 测试通过
3. 无阻断性 bug
4. 文档更新
