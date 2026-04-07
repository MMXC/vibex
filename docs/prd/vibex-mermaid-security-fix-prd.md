# Mermaid 组件 XSS 防护修复 PRD

**项目**: vibex-mermaid-security-fix  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement (问题陈述)

MermaidPreview 组件存在 XSS（跨站脚本攻击）安全漏洞。由于使用了 `securityLevel: 'loose'` 配置，攻击者可以通过构造恶意 Mermaid 代码执行任意 JavaScript 脚本，窃取用户 cookie 或进行其他恶意操作。

**风险等级**: 🔴 高

---

## 2. Goals & Non-Goals

### 2.1 Goals (目标)
- 消除 MermaidPreview 组件的 XSS 漏洞
- 确保修复后所有图表渲染功能正常
- 验证边界情况被正确处理

### 2.2 Non-Goals (非目标)
- 不添加新的 Mermaid 功能
- 不修改现有的图表样式系统
- 不涉及后端 API 修改

---

## 3. Functional Requirements

### 3.1 核心修复需求

| ID | 需求描述 | 优先级 | 验收标准 |
|----|---------|-------|---------|
| FR-01 | 修改 MermaidPreview 组件的 securityLevel 配置 | P0 | 将 `securityLevel: 'loose'` 改为 `'strict'` |
| FR-02 | 验证修复后流程图渲染正常 | P0 | 加载 confirm/context 页面，流程图正常显示 |
| FR-03 | 验证修复后类图渲染正常 | P0 | 加载 confirm/model 页面，类图正常显示 |
| FR-04 | 验证修复后状态图渲染正常 | P0 | 加载 confirm/flow 页面，状态图正常显示 |
| FR-05 | 验证 MermaidEditor 实时预览功能 | P0 | 编辑 Mermaid 代码，实时预览正常更新 |
| FR-06 | 验证节点样式 (classDef) 正常应用 | P1 | 自定义样式图表渲染正常 |
| FR-07 | XSS 攻击测试通过 | P0 | 恶意脚本标签无法执行 |

### 3.2 边界情况处理

| ID | 场景 | 预期行为 |
|----|-----|---------|
| BC-01 | 空 Mermaid 代码 | 显示占位提示，不崩溃 |
| BC-02 | 无效 Mermaid 语法 | 显示解析错误提示 |
| BC-03 | 超长 Mermaid 代码 | 正常渲染或显示截断提示 |
| BC-04 | 特殊字符转义 | 正确显示，不执行 |

---

## 4. UI/UX Flow

### 4.1 修复范围

**涉及文件**:
```
src/components/ui/MermaidPreview.tsx  ← 主要修改
```

**直接关联文件** (需验证不受影响):
```
src/components/ui/MermaidEditor.tsx
src/app/confirm/context/page.tsx
src/app/confirm/flow/page.tsx
src/app/confirm/model/page.tsx
```

### 4.2 修改点

**MermaidPreview.tsx 第 36-49 行**:
```typescript
// 修改前
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',  // ❌ 不安全
  themeVariables: { ... }
});

// 修改后
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',  // ✅ 安全
  themeVariables: { ... }
});
```

---

## 5. Epic Breakdown

### Epic 1: XSS 漏洞修复
- **Story 1.1**: 修改 MermaidPreview securityLevel 配置
- **Story 1.2**: 验证图表渲染功能不受影响

### Epic 2: XSS 攻击防御验证
- **Story 2.1**: 编写 XSS 攻击测试用例
- **Story 2.2**: 执行边界情况测试
- **Story 2.3**: 验证恶意代码被阻止执行

### Epic 3: 回归测试
- **Story 3.1**: 验证 MermaidEditor 实时预览
- **Story 3.2**: 验证节点样式 (classDef) 功能
- **Story 3.3**: 验证所有 confirm 页面渲染正常

---

## 6. Acceptance Criteria (验收标准)

### 6.1 功能验收

| # | 验收条件 | 测试方法 |
|---|---------|---------|
| 1 | `securityLevel` 已改为 `'strict'` | 代码审查 |
| 2 | 流程图正常渲染 | 手动测试 confirm/context |
| 3 | 类图正常渲染 | 手动测试 confirm/model |
| 4 | 状态图正常渲染 | 手动测试 confirm/flow |
| 5 | MermaidEditor 预览正常 | 编辑代码实时预览 |
| 6 | XSS 攻击被阻止 | 注入测试脚本不执行 |

### 6.2 XSS 攻击测试用例

```typescript
// 测试用例 1: 基本 script 标签
const maliciousCode1 = 'graph TD\n  A[<script>alert("XSS")</script>] --> B';

// 测试用例 2: img onerror 事件
const maliciousCode2 = 'graph TD\n  A["<img src=x onerror=alert(1)>"] --> B';

// 测试用例 3: svg onload 事件
const maliciousCode3 = 'graph TD\n  A[<svg onload=alert(1)>] --> B';

// 期望结果: 所有攻击向量被阻止，无弹窗，无请求发送
```

---

## 7. Non-Functional Requirements

| 需求类型 | 要求 |
|---------|-----|
| **性能** | 修改配置不影响渲染性能 |
| **兼容性** | 兼容现有 Mermaid 语法 |
| **可维护性** | 添加安全配置注释说明 |
| **测试覆盖** | 覆盖主要图表类型和边界情况 |

---

## 8. Dependencies

- **前置**: xss-analysis.md (已完成)
- **后续**: 无
- **依赖**: 无外部依赖

---

## 9. Timeline Estimate

| 阶段 | 工作量 | 说明 |
|-----|-------|-----|
| 修复配置 | 0.5h | 修改一行代码 |
| 功能验证 | 1h | 手动测试各页面 |
| XSS 测试 | 1h | 编写和执行攻击测试 |
| 回归测试 | 0.5h | 验证相关功能 |
| **总计** | **3h** | |

---

## 10. Risk & Mitigation

| 风险 | 影响 | 缓解措施 |
|-----|-----|---------|
| strict 级别影响某些功能 | 低 | 验证清单覆盖主要功能 |
| 遗漏隐藏入口 | 低 | 全面审查组件使用位置 |

---

*PRD 完成于 2026-03-05 (PM Agent)*
