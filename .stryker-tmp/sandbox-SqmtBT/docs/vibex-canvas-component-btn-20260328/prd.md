# PRD：「继续·组件树」按钮修复

**项目**: vibex-canvas-component-btn-20260328  
**版本**: v1.0  
**日期**: 2026-03-28  
**Owner**: PM  
**状态**: Draft

---

## 1. 背景与目标

### 1.1 问题描述

流程树画布区域缺少「继续·组件树」按钮，用户在完成流程树编辑后，无法继续下一步（组件树生成），导致核心流程断点。

### 1.2 目标

在流程树画布区域添加「继续·组件树」按钮，用户点击后将流程数据发送到后端，获取组件树卡片数据并渲染。

---

## 2. Epic & Story 拆分

### Epic E1: 「继续·组件树」按钮能力

**总工期**: 1-2h  
**目标**: 用户可在流程树画布触发组件树生成流程

---

### Story S1.1: 按钮添加与可见性

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1.1 | 按钮存在性 | 「继续·组件树」按钮在流程树画布区域可见 | `expect(page.locator('text=继续·组件树')).toBeVisible()` | ✅ canvas/page.tsx |
| F1.1.2 | 按钮位置 | 按钮位于流程树画布底部工具栏区域 | `expect(btn).toHaveCSS('position', 'relative'\|'absolute')` + 截图验证位于工具栏内 | ✅ canvas/page.tsx |
| F1.1.3 | 按钮文案 | 按钮文案为「继续·组件树」 | `expect(btn).toHaveText('继续·组件树')` | ✅ canvas/page.tsx |

**DoD**: 
- [ ] 按钮在流程树画布页面可见
- [ ] 按钮位置符合 UX 设计（在底部工具栏）
- [ ] 按钮文案正确
- [ ] 按钮样式与其他画布按钮一致

**依赖**: 无

---

### Story S1.2: 按钮数据绑定

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.2.1 | 数据读取 | 按钮点击时从 Zustand store 读取 flowData | `expect(useDDDStore.getState().flowData).toBeDefined()` | ✅ useDDDStore |
| F1.2.2 | 空数据禁用 | flowData 为空时按钮禁用（disabled） | `expect(btn).toBeDisabled()` when flowData === null | ✅ canvas/page.tsx |
| F1.2.3 | 有数据可用 | flowData 存在时按钮可点击 | `expect(btn).toBeEnabled()` when flowData !== null | ✅ canvas/page.tsx |

**DoD**:
- [ ] 按钮正确订阅 flowData 状态
- [ ] 空数据时按钮 disabled 属性生效
- [ ] 有数据时按钮 enabled

**依赖**: S1.1

---

### Story S1.3: API 调用与状态更新

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.3.1 | API 请求 | 点击按钮后发送 POST 请求到组件树 API | `expect(networkRequests).toContainEqual(expect.objectContaining({ url: /component-tree/, method: 'POST' }))` | ✅ canvas/page.tsx |
| F1.3.2 | 请求参数 | 请求体包含 flowData | `expect(requestBody).toMatchObject({ flowData })` | ✅ canvas/page.tsx |
| F1.3.3 | 加载状态 | 请求期间按钮显示 loading 状态 | `expect(btn).toHaveText(/.*加载中.*/)` or `expect(btn).toBeDisabled()` | ✅ canvas/page.tsx |
| F1.3.4 | 成功回调 | 请求成功后更新 store 的 componentTree 字段 | `expect(useDDDStore.getState().componentTree).toBeDefined()` | ✅ useDDDStore |
| F1.3.5 | 错误处理 | 请求失败时显示错误提示 | `expect(page.locator('text=/错误|失败/')).toBeVisible()` | ✅ canvas/page.tsx |

**DoD**:
- [ ] API 请求正确发出
- [ ] 请求参数包含 flowData
- [ ] 加载中状态正确显示
- [ ] 成功后 store 更新
- [ ] 失败时错误提示可见

**依赖**: S1.2

---

### Story S1.4: 组件树卡片渲染

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.4.1 | 卡片渲染 | API 返回后渲染组件树卡片 | `expect(page.locator('[data-testid="component-tree-card"]')).toBeVisible()` | ✅ canvas/page.tsx |
| F1.4.2 | 卡片内容 | 组件树卡片包含组件节点列表 | `expect(card.locator('text=/组件/')).toHaveCount({ minimum: 1 })` | ✅ canvas/page.tsx |
| F1.4.3 | 交互性 | 组件树卡片可展开/收起 | `expect(card.locator('text=展开')).toBeVisible()` | ✅ canvas/page.tsx |

**DoD**:
- [ ] 组件树卡片正确渲染
- [ ] 卡片包含节点数据
- [ ] 卡片交互功能正常

**依赖**: S1.3

---

## 3. 优先级矩阵

| Story | 功能点 | 优先级 | 工作量 | 说明 |
|-------|--------|--------|--------|------|
| S1.1 | F1.1.1-F1.1.3 | P0 | 0.5h | 基础按钮可见 |
| S1.2 | F1.2.1-F1.2.3 | P0 | 0.25h | 数据绑定 |
| S1.3 | F1.3.1-F1.3.5 | P0 | 0.5h | API 调用核心逻辑 |
| S1.4 | F1.4.1-F1.4.3 | P1 | 0.5h | 渲染依赖 API 返回 |

---

## 4. 验收标准总结

### 4.1 正面路径（Happy Path）

```
用户进入流程树画布 → 存在 flowData → 「继续·组件树」按钮可用
→ 点击按钮 → 显示 loading → POST /component-tree/ with flowData
→ 返回 200 → store 更新 componentTree → 组件树卡片渲染
```

### 4.2 边界情况

| 场景 | 预期行为 | 验证 |
|------|----------|------|
| flowData 为空 | 按钮禁用 | `expect(btn).toBeDisabled()` |
| flowData 为空字符串 | 按钮禁用 | `expect(btn).toBeDisabled()` |
| API 返回 500 | 显示错误提示 | `expect(page.locator('text=/错误/')).toBeVisible()` |
| API 超时（>10s） | 显示超时提示 | `expect(page.locator('text=/超时/')).toBeVisible()` |
| 快速双击 | 防止重复提交 | 第二次点击被忽略 |

### 4.3 DoD 清单

- [ ] 所有 P0 功能点验收标准通过
- [ ] gstack 截图验证按钮可见
- [ ] network 监控验证 API 请求
- [ ] 边界情况测试通过
- [ ] 代码 review 通过

---

## 5. 技术约束

- **前端框架**: Next.js + TypeScript
- **状态管理**: Zustand (`useDDDStore`)
- **API 调用**: 复用现有 `canvasApi.ts`
- **测试**: gstack browse 验证

---

## 6. 参考文档

- 分析文档: `docs/vibex-canvas-component-btn-20260328/analysis.md`
- 相关组件: `src/app/canvas/page.tsx`, `src/store/useDDDStore.ts`
