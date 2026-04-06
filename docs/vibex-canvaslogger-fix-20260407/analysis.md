# Analysis: canvasLogger 未定义导致构建失败

**项目**: vibex-canvaslogger-fix-20260407
**分析人**: Analyst
**日期**: 2026-04-07

---

## 1. 执行摘要

**问题**: `export/page.tsx` 使用了 `canvasLogger.default.error()` 但未导入 `canvasLogger`，导致构建失败。

**根因**: Commit `b85f3ac7` 将 `console.error` 替换为 `canvasLogger.default.error`，但遗漏了顶層 import 语句。

**方案**: 在文件顶部添加一行 import，工作量 ~0.05h。

---

## 2. 问题定位

### 2.1 Git History 分析

| Commit | 操作 |
|--------|------|
| `b85f3ac7` | 将 `console.error` 替换为 `canvasLogger.default.error`，但遗漏 import |
| `f03bea27` | 添加 PNG/SVG/ZIP 导出选项 |
| `5e8450e3` | 添加 React Native 和 WebP 导出格式 |

**b85f3ac7** 是关键 commit，来自全量 `console.* → canvasLogger` 重构，覆盖 102 个前端文件。

### 2.2 根因分析

**文件**: `src/app/export/page.tsx`

```tsx
// ❌ 第 169 行 — 这不是 import！是模板字符串里的代码生成文本
const componentCode = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { canvasLogger } from '@/lib/canvas/canvasLogger';  // ← 仅仅是字符串中的文本
export const VibeXCanvas: React.FC = () => ...
`;

// ❌ 第 265 行 — 实际调用，但 canvasLogger 未定义
} catch (err) {
  canvasLogger.default.error('Export failed:', err);  // ← ReferenceError: canvasLogger is not defined
  alert('导出失败，请重试');
  setIsExporting(false);
}
```

**缺少**: 文件顶部没有 `import { canvasLogger } from '@/lib/canvas/canvasLogger';`

---

## 3. 方案对比

### 方案 A：添加顶层 import（推荐）

```tsx
import { canvasLogger } from '@/lib/canvas/canvasLogger';
import { useState } from 'react';
// ...其他现有 imports
```

| 维度 | 评分 |
|------|------|
| 工作量 | ~0.05h（1行） |
| 风险 | 低 |
| 与项目规范一致性 | 高（b85f3ac7 引入的标准做法） |

### 方案 B：改回 console.error

```tsx
} catch (err) {
  console.error('Export failed:', err);
}
```

| 维度 | 评分 |
|------|------|
| 工作量 | ~0.02h（1行） |
| 风险 | 无 |
| 与项目规范一致性 | 低（违反 b85f3ac7 引入的 no-console ESLint 规则） |

---

## 4. 推荐方案

**方案 A**：在 `export/page.tsx` 顶部添加 import。

**理由**：
1. 与 b85f3ac7 的全量重构保持一致（102 个文件已按此方式迁移）
2. 遵守项目 no-console ESLint 规则
3. 工作量极低，风险为零
4. canvasLogger 仅在 dev 模式输出，不影响生产

---

## 5. 历史经验

来自 `MEMORY.md` 模式 "功能已实现但未集成"：
> **特征**: 代码已存在，但未被使用/导入
> **检查方法**: 搜索相关组件/函数，检查是否被导入调用
> **案例**: RecoveryDialog 组件存在但 confirm/page.tsx 未导入

本次问题属于同一模式——`canvasLogger` 在 catch block 被使用，但未在模块顶部导入。

---

## 6. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| 1 | `canvasLogger` 在 export/page.tsx 顶部正确 import | `grep "import.*canvasLogger" export/page.tsx` 在前10行 |
| 2 | 构建成功无错误 | `npm run build 2>&1` 无 canvasLogger 相关错误 |
| 3 | TypeScript 类型检查通过 | `npx tsc --noEmit` 无新增错误 |
| 4 | 功能回归：导出失败时仍正确 alert | 手动测试导出异常路径 |

---

## 7. 实施建议

```tsx
// src/app/export/page.tsx 顶部，useState import 之后添加：
import { useState } from 'react';
import Link from 'next/link';
import { canvasLogger } from '@/lib/canvas/canvasLogger';  // ← 新增
import { FrameworkSelector, type Framework } from '@/components/export-panel/framework-selector';
```

**预计工时**: 0.05h
**影响文件**: 1 个
**风险**: 无
