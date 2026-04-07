# CSS Tokens 迁移需求分析

> **项目**: CSS Tokens Migration
> **分析师**: Analyst Agent
> **日期**: 2026-03-10
> **状态**: 需求分析完成

---

## 1. 执行摘要

**核心结论**: 项目已有完善的 Design Tokens 系统，但 **408 处内联样式** 未迁移，导致样式分散、维护成本高、主题切换不完整。

**关键指标**:
| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 内联样式数量 | 408 处 | 0 处 |
| 颜色硬编码 | 49 种 | 0 种 |
| 字号硬编码 | 43 种 | 0 种 |
| 主题覆盖率 | ~30% | 100% |

**推荐方案**: 渐进式迁移 + AST 自动化，预估工作量 **3 人日**。

---

## 2. 问题定义

### 2.1 核心痛点

1. **样式分散**: 408 处 `style={{ }}` 内联样式分布在 20+ 文件中
2. **硬编码颜色**: 49 种颜色值直接写在组件中，无法响应主题切换
3. **字号不统一**: 43 种字号值，与 Design Tokens 定义不一致
4. **维护成本高**: 修改一个颜色需要搜索替换多处代码

### 2.2 影响范围

**受影响文件 TOP 10**:
| 文件 | 内联样式数 | 风险等级 |
|------|-----------|---------|
| `preview/page.tsx` | 60 | 高 |
| `pagelist/page.tsx` | 55 | 高 |
| `project-settings/page.tsx` | 54 | 高 |
| `prototype/editor/page.tsx` | 42 | 高 |
| `prototype/page.tsx` | 32 | 中 |
| `AIChatPanel.tsx` | 17 | 中 |
| `auth/page.tsx` | 17 | 中 |
| `DomainModelGraph.tsx` | 14 | 低 |
| `MermaidPreview.tsx` | 13 | 低 |
| `user-settings/page.tsx` | 12 | 低 |

---

## 3. 现状分析

### 3.1 已有 Design Tokens 系统

**✅ 已建立完善的 CSS 变量体系**:

```
src/styles/
├── design-tokens.css    # 未来风格设计系统 (赛博朋克主题)
├── tokens.css           # 标准 Design Tokens
├── tokens.ts            # TypeScript 版本
└── ThemeProvider.tsx    # 主题切换组件
```

**CSS 变量覆盖**:
- ✅ 颜色系统: 20+ CSS 变量 (`--color-primary`, `--color-text-secondary` 等)
- ✅ 字体系统: 9 级字号 (`--font-size-xs` ~ `--font-size-4xl`)
- ✅ 间距系统: 10 级间距 (`--spacing-1` ~ `--spacing-16`)
- ✅ 圆角系统: 8 级圆角 (`--radius-sm` ~ `--radius-full`)
- ✅ 阴影系统: 6 级阴影 (`--shadow-sm` ~ `--shadow-2xl`)

### 3.2 内联样式模式分析

**颜色硬编码 TOP 10**:
| 颜色值 | 出现次数 | 对应语义 | 建议 Token |
|--------|---------|---------|-----------|
| `#64748b` | 26 | 次要文本 | `--color-text-secondary` |
| `#94a3b8` | 19 | 三级文本 | `--color-text-tertiary` |
| `#6b7280` | 13 | 次要文本 | `--color-text-secondary` |
| `#fff` / `white` | 19 | 反色文本 | `--color-text-inverse` |
| `#e2e8f0` | 7 | 边框色 | `--color-border` |
| `#10b981` | 7 | 成功色 | `--color-success` |
| `#666` | 6 | 次要文本 | `--color-text-secondary` |
| `#3b82f6` | 6 | 主色 | `--color-primary` |
| `#0070f3` | 6 | 主色变体 | `--color-primary` |
| `#f59e0b` | 5 | 警告色 | `--color-warning` |

**字号硬编码分布**:
| 字号 | 出现次数 | 建议 Token |
|------|---------|-----------|
| `14px` | 57 | `--font-size-sm` |
| `13px` | 29 | `--font-size-sm` (统一为 14px) |
| `12px` | 16 | `--font-size-xs` |
| `24px` | 8 | `--font-size-2xl` |
| `20px` | 6 | `--font-size-xl` |
| `18px` | 6 | `--font-size-lg` |
| `16px` | 5 | `--font-size-base` |
| 其他 | 13 | 逐一映射 |

**间距硬编码分布**:
| 间距值 | 出现次数 | 建议 Token |
|--------|---------|-----------|
| `8px` / `gap: '8px'` | 17 | `--spacing-2` |
| `12px` | 10 | `--spacing-3` |
| `16px` | 8 | `--spacing-4` |
| `6px` | 2 | `--spacing-1.5` (新增) |
| `24px` | 2 | `--spacing-6` |
| `32px` | 1 | `--spacing-8` |

---

## 4. 方案对比

### 方案 A: 手动逐文件迁移

**描述**: 开发者逐个文件手动修改内联样式为 CSS Modules 或 Tailwind 类

| 维度 | 评估 |
|------|------|
| 工作量 | 5 人日 |
| 风险 | 低 (人工检查) |
| 质量 | 高 (可优化代码结构) |
| 可维护性 | 需持续人工 review |

**优点**:
- 完全可控
- 可顺便重构组件结构

**缺点**:
- 工作量大
- 容易遗漏
- 不适合快速迭代

---

### 方案 B: AST 自动化迁移 (推荐)

**描述**: 使用 TypeScript AST 自动分析并替换内联样式

| 维度 | 评估 |
|------|------|
| 工作量 | 3 人日 |
| 风险 | 中 (需测试验证) |
| 质量 | 中 (需人工抽检) |
| 可维护性 | 脚本可复用 |

**实现步骤**:

```typescript
// scripts/migrate-inline-styles.ts
import * as ts from 'typescript'
import * as fs from 'fs'

// 颜色映射表
const COLOR_MAP: Record<string, string> = {
  '#64748b': 'var(--color-text-secondary)',
  '#94a3b8': 'var(--color-text-tertiary)',
  '#6b7280': 'var(--color-text-secondary)',
  '#fff': 'var(--color-text-inverse)',
  'white': 'var(--color-text-inverse)',
  '#e2e8f0': 'var(--color-border)',
  '#10b981': 'var(--color-success)',
  // ...更多映射
}

// 字号映射表
const FONT_SIZE_MAP: Record<string, string> = {
  '12px': 'var(--font-size-xs)',
  '13px': 'var(--font-size-sm)', // 或统一为 14px
  '14px': 'var(--font-size-sm)',
  '16px': 'var(--font-size-base)',
  '18px': 'var(--font-size-lg)',
  '20px': 'var(--font-size-xl)',
  '24px': 'var(--font-size-2xl)',
  // ...更多映射
}

function transformStyleObject(styleObj: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression {
  const newProperties = styleObj.properties.map(prop => {
    if (!ts.isPropertyAssignment(prop)) return prop
    
    const name = prop.name.getText()
    const value = prop.initializer
    
    // 颜色转换
    if (name === 'color' && ts.isStringLiteral(value)) {
      const mapped = COLOR_MAP[value.text]
      if (mapped) {
        return ts.factory.updatePropertyAssignment(
          prop,
          prop.name,
          ts.factory.createStringLiteral(mapped)
        )
      }
    }
    
    // 字号转换
    if (name === 'fontSize' && ts.isStringLiteral(value)) {
      const mapped = FONT_SIZE_MAP[value.text]
      if (mapped) {
        return ts.factory.updatePropertyAssignment(
          prop,
          prop.name,
          ts.factory.createStringLiteral(mapped)
        )
      }
    }
    
    return prop
  })
  
  return ts.factory.updateObjectLiteralExpression(styleObj, newProperties)
}
```

**优点**:
- 自动化程度高
- 可复用脚本
- 一致性强

**缺点**:
- 需要充分测试
- 复杂样式可能需要人工处理

---

### 方案 C: CSS Modules + Tailwind 混合

**描述**: 将内联样式提取为 CSS Modules，关键组件使用 Tailwind 类

| 维度 | 评估 |
|------|------|
| 工作量 | 4 人日 |
| 风险 | 中 |
| 质量 | 高 (最佳实践) |
| 可维护性 | 高 |

**实现示例**:

```tsx
// 迁移前
<div style={{ color: '#64748b', fontSize: '14px', padding: '16px' }}>

// 迁移后 (CSS Modules)
import styles from './Component.module.css'
<div className={styles.container}>

/* Component.module.css */
.container {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  padding: var(--spacing-4);
}
```

**优点**:
- 符合最佳实践
- 易于维护
- 支持 SSR

**缺点**:
- 需要创建大量 CSS 文件
- 部分动态样式仍需内联

---

## 5. 推荐方案

**选择方案 B: AST 自动化迁移**

**理由**:
1. **效率最高**: 3 人日 vs 5 人日
2. **覆盖完整**: 自动扫描所有文件，不遗漏
3. **可复用**: 脚本可用于未来类似迁移
4. **风险可控**: 通过 E2E 测试验证

**实施路径**:
```
Week 1 Day 1: 编写 AST 迁移脚本 + 映射表
Week 1 Day 2: 执行迁移 + 单元测试
Week 1 Day 3: E2E 测试 + 人工抽检 + 修复
```

---

## 6. 验收标准

### 6.1 功能验收

| 验收项 | 验收标准 | 验证方法 |
|--------|---------|---------|
| 内联样式清零 | `grep -rn "style={{" src --include="*.tsx" | wc -l` = 0 | 自动化脚本 |
| 颜色 Token 化 | 硬编码颜色值 = 0 | `grep -ohE "color:\s*['\"]#[^'\"]+['\"]" | wc -l` = 0 |
| 字号 Token 化 | 硬编码字号值 = 0 | `grep -ohE "fontSize:\s*['\"][^'\"]+['\"]" | wc -l` = 0 |
| 主题切换 | 暗色/亮色主题切换正常 | E2E 测试 |
| 视觉回归 | 无明显 UI 变化 | 截图对比 |

### 6.2 质量验收

```bash
# 1. 无内联样式
test $(grep -rn "style={{" src --include="*.tsx" | wc -l) -eq 0

# 2. 无硬编码颜色
test $(grep -ohE "color:\s*['\"]#[0-9a-fA-F]{3,6}['\"]" src -r --include="*.tsx" | wc -l) -eq 0

# 3. E2E 测试通过
pnpm test:e2e

# 4. 构建成功
pnpm build
```

---

## 7. 风险评估

### 7.1 风险矩阵

| 风险 | 概率 | 影响 | 等级 | 缓解措施 |
|------|------|------|------|---------|
| AST 解析失败 | 低 | 高 | 🟡 中 | 手动处理异常文件 |
| 动态样式处理 | 中 | 中 | 🟡 中 | 保留必要的内联样式 |
| 视觉回归 | 中 | 高 | 🟠 高 | 截图对比测试 |
| 主题切换异常 | 低 | 高 | 🟡 中 | E2E 测试覆盖 |

### 7.2 回滚策略

1. **Git 分支保护**: 在独立分支进行迁移，不合并到主分支直到测试通过
2. **增量提交**: 按文件/模块分批提交，便于定位问题
3. **快速回滚**: 保留原始文件备份，可快速回滚

---

## 8. 技术风险

### 8.1 复杂样式处理

**问题**: 部分动态样式无法完全 Token 化

**示例**:
```tsx
// 动态计算的颜色
<div style={{ color: `rgba(${r}, ${g}, ${b}, 0.5)` }}>

// 条件样式
<div style={{ color: isActive ? '#10b981' : '#64748b' }}>
```

**解决方案**:
1. 动态样式保留内联，但使用 CSS 变量
2. 条件样式使用 CSS 类切换
3. 复杂动画保留内联

### 8.2 第三方组件

**问题**: 部分第三方组件不接受 CSS 类

**解决方案**:
1. 优先使用组件支持的 `className` 或 `style` prop
2. 使用 CSS-in-JS 包装器

---

## 9. 下一步行动

| 序号 | 行动项 | 负责人 | 预估时间 |
|------|--------|--------|---------|
| 1 | PM 编写 PRD，拆分 Epic/Story | PM | 0.5 天 |
| 2 | Architect 设计迁移架构 | Architect | 0.5 天 |
| 3 | Developer 实现迁移脚本 | Developer | 1 天 |
| 4 | Developer 执行迁移 + 测试 | Developer | 1 天 |
| 5 | Tester 执行 E2E 测试 | Tester | 0.5 天 |

**总计**: 3.5 人日

---

## 附录

### A. 颜色映射完整表

| 原值 | Token | 语义 |
|------|-------|------|
| `#64748b` | `var(--color-text-secondary)` | 次要文本 |
| `#94a3b8` | `var(--color-text-tertiary)` | 三级文本 |
| `#6b7280` | `var(--color-text-secondary)` | 次要文本 |
| `#fff` | `var(--color-text-inverse)` | 反色文本 |
| `white` | `var(--color-text-inverse)` | 反色文本 |
| `#e2e8f0` | `var(--color-border)` | 边框 |
| `#10b981` | `var(--color-success)` | 成功 |
| `#666` | `var(--color-text-secondary)` | 次要文本 |
| `#3b82f6` | `var(--color-primary)` | 主色 |
| `#0070f3` | `var(--color-primary)` | 主色 |
| `#f59e0b` | `var(--color-warning)` | 警告 |
| `#8b5cf6` | `var(--color-secondary)` | 辅助色 |
| `#dc2626` | `var(--color-error)` | 错误 |
| `#ef4444` | `var(--color-error)` | 错误 |

### B. 字号映射完整表

| 原值 | Token |
|------|-------|
| `10px` | `var(--font-size-xs)` (统一为 12px) |
| `11px` | `var(--font-size-xs)` (统一为 12px) |
| `12px` | `var(--font-size-xs)` |
| `13px` | `var(--font-size-sm)` (统一为 14px) |
| `14px` | `var(--font-size-sm)` |
| `15px` | `var(--font-size-base)` (统一为 16px) |
| `16px` | `var(--font-size-base)` |
| `18px` | `var(--font-size-lg)` |
| `20px` | `var(--font-size-xl)` |
| `24px` | `var(--font-size-2xl)` |
| `28px` | `var(--font-size-3xl)` (统一为 30px) |
| `32px` | `var(--font-size-3xl)` |
| `48px` | `var(--font-size-4xl)` |

---

*分析完成时间: 2026-03-10 00:05*
*Analyst Agent*