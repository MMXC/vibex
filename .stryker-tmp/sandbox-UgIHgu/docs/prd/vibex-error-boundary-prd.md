# ErrorBoundary 部署 PRD

**项目**: vibex-error-boundary  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

项目已存在功能完整的 `ErrorBoundary` 组件，但**零部署**。高风险组件（如 MermaidPreview）使用 `dangerouslySetInnerHTML` + 外部库，存在渲染崩溃风险。当前状态：
- ✅ ErrorBoundary 组件已完整实现
- ❌ 根布局未使用
- ❌ 6 个高风险组件未保护

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 在关键位置部署 ErrorBoundary
- 定义分级错误 UI 设计
- 确保 Mermaid 渲染错误不崩溃应用

### 2.2 Non-Goals
- 不修改 ErrorBoundary 组件本身
- 不添加新功能
- 不修改业务逻辑

---

## 3. ErrorBoundary 部署位置

### 3.1 P0 - 根布局 (立即)

| 位置 | 文件 | 作用 |
|-----|------|------|
| 全局兜底 | `app/layout.tsx` | 捕获未处理的严重错误 |

### 3.2 P1 - 高风险组件 (短期)

| 组件 | 文件 | 风险 |
|-----|------|------|
| `MermaidPreview` | `components/ui/MermaidPreview.tsx` | 🔴 高 |
| `DomainModelGraph` | `components/ui/DomainModelGraph.tsx` | 🟡 中 |
| `BusinessFlowGraph` | `components/ui/BusinessFlowGraph.tsx` | 🟡 中 |
| `BoundedContextGraph` | `components/ui/BoundedContextGraph.tsx` | 🟡 中 |

### 3.3 P2 - 页面级 (中期)

| 页面 | 文件 |
|-----|------|
| DDD 确认页 | `app/confirm/context/page.tsx` |
| 流程确认页 | `app/confirm/flow/page.tsx` |
| 模型确认页 | `app/confirm/model/page.tsx` |

---

## 4. 错误 UI 设计

### 4.1 Level 1: 全局错误 (页面级)

用于 `layout.tsx`，捕获严重错误：

```
┌─────────────────────────────────────┐
│           🚨                        │
│      应用遇到了问题                  │
│                                     │
│  我们正在努力修复，请稍后再试。       │
│                                     │
│        [刷新页面]                    │
│                                     │
│   错误代码: ERR_XXX (仅开发模式)    │
└─────────────────────────────────────┘
```

### 4.2 Level 2: 组件错误 (MermaidPreview)

用于高风险组件，提供降级 UI：

```
┌─────────────────────────────────────┐
│  ⚠️ 图表渲染失败                     │
│                                     │
│  无法渲染此图表，可能是语法错误。     │
│                                     │
│  [查看原始代码] [重试]              │
└─────────────────────────────────────┘
```

### 4.3 MermaidPreview Fallback 实现

```tsx
// components/ui/MermaidPreview.tsx
import { ErrorBoundary } from './ErrorBoundary';

function MermaidErrorFallback({ error, resetError }) {
  return (
    <div className="mermaid-error">
      <AlertTriangle size={24} />
      <p>图表渲染失败</p>
      <p className="hint">无法渲染此图表，可能是语法错误</p>
      <div className="actions">
        <button onClick={resetError}>重试</button>
      </div>
    </div>
  );
}

export function MermaidPreview(props) {
  return (
    <ErrorBoundary fallback={MermaidErrorFallback}>
      <MermaidPreviewInner {...props} />
    </ErrorBoundary>
  );
}
```

---

## 5. Implementation Plan

### 步骤 1: 根布局包裹 (P0)

```tsx
// app/layout.tsx
import { ErrorBoundary } from '@/components/ui';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 步骤 2: 高风险组件包裹 (P1)

为 4 个高风险组件添加 ErrorBoundary：
- MermaidPreview
- DomainModelGraph  
- BusinessFlowGraph
- BoundedContextGraph

### 步骤 3: 页面级包裹 (P2)

为 confirm 页面添加 ErrorBoundary

---

## 6. Definition of Done (验收标准)

### 6.1 功能验收

| # | 验收条件 | 测试方法 |
|---|---------|---------|
| DoD-1 | 根布局 ErrorBoundary 正常工作 | 模拟根级错误验证 |
| DoD-2 | MermaidPreview 渲染错误被捕获 | 注入错误 Mermaid 代码 |
| DoD-3 | 重试按钮正常工作 | 点击重试验证恢复 |
| DoD-4 | 刷新页面按钮正常工作 | 点击验证页面刷新 |
| DoD-5 | 开发模式显示错误详情 | dev 模式检查 |
| DoD-6 | 生产模式隐藏错误详情 | prod 模式检查 |

### 6.2 质量验收

| # | 验收条件 | 目标值 |
|---|---------|-------|
| DoD-7 | 高风险组件 100% 覆盖 | 4/4 已保护 |
| DoD-8 | 编译检查通过 | 0 errors |
| DoD-9 | 运行时无崩溃 | 错误被正确捕获 |

### 6.3 回归测试用例

| 场景 | 预期结果 |
|------|---------|
| Mermaid 语法错误 | 显示错误 Fallback，不崩溃 |
| ReactFlow 数据错误 | 显示错误 Fallback，不崩溃 |
| 全局未捕获错误 | 显示全局错误页面 |

---

## 7. Risk Mitigation

| 风险 | 等级 | 缓解措施 |
|-----|------|---------|
| SSR 兼容 | 🟢 低 | ErrorBoundary 已标记 'use client' |
| 样式冲突 | 🟢 低 | 使用 CSS Module |
| 错误信息泄露 | 🟡 中 | 仅开发模式显示详情 |

---

## 8. Non-Functional Requirements

| 需求类型 | 要求 |
|---------|-----|
| **性能** | ErrorBoundary 不增加渲染开销 |
| **兼容性** | 兼容现有暗色主题 |
| **可访问性** | 错误信息清晰，提供重试选项 |

---

## 9. Timeline Estimate

| 阶段 | 工作量 | 说明 |
|-----|-------|------|
| 根布局部署 | 0.5h | 添加到 layout.tsx |
| 高风险组件部署 | 2h | 4 个组件 |
| 页面级部署 | 1h | 3 个 confirm 页面 |
| 验证测试 | 1h | 回归测试 |
| **总计** | **4.5h** | |

---

## 10. Dependencies

- **前置**: analyze-error-boundary (已完成)
- **依赖**: ErrorBoundary.tsx 已存在，无需开发

---

*PRD 完成于 2026-03-05 (PM Agent)*
