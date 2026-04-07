# Architecture: canvasLogger Import Fix

**项目**: vibex-canvaslogger-fix-20260407
**阶段**: design-architecture
**状态**: Final
**Architect**: Architect
**日期**: 2026-04-07

---

## 1. 问题摘要

### 根因
Commit `b85f3ac7` 将全量 `console.*` 替换为 `canvasLogger.default.*`（102 个前端文件），但 `src/app/export/page.tsx` **遗漏了顶层 import**，导致运行时 `ReferenceError: canvasLogger is not defined`。

### 问题定位
文件 `vibex-fronted/src/app/export/page.tsx`:
- **第 265 行**: `canvasLogger.default.error('Export failed:', err)` — 实际调用
- **第 169 行**: `import { canvasLogger } from '@/lib/canvas/canvasLogger';` — 仅是模板字符串内的代码生成文本，不是真实 import
- **文件顶部**: 缺少顶层 import 语句

---

## 2. 技术方案

### 修复内容
在 `src/app/export/page.tsx` 顶部添加一行 import：

```tsx
// src/app/export/page.tsx 顶部（useState import 之后）
import { canvasLogger } from '@/lib/canvas/canvasLogger';
```

### 修复后文件顶部预期结构
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { canvasLogger } from '@/lib/canvas/canvasLogger';  // ← 新增
import { FrameworkSelector, type Framework } from '@/components/export-panel/framework-selector';
import { reactComponentToSvelte } from '@/lib/react2svelte';
import styles from './export.module.css';
```

---

## 3. 模块划分

```
src/app/export/page.tsx (修复文件)
  ├── 顶层 import 区块（+canvasLogger）
  ├── 状态定义 (useState)
  ├── 导出格式配置 (prdFormats)
  ├── 导出函数 (handleExportPDF, handleExportMarkdown, handleExportCode)
  │   └── catch block → canvasLogger.default.error (已存在，修复后生效)
  └── 渲染逻辑 (JSX)
```

**依赖关系**:
- `canvasLogger` ← `@/lib/canvas/canvasLogger` (已存在，无需新增)
- 无新增依赖

---

## 4. 技术选型

| 项目 | 选择 | 理由 |
|------|------|------|
| import 来源 | `@/lib/canvas/canvasLogger` | b85f3ac7 引入的标准路径，102 个文件已使用 |
| import 语法 | `import { canvasLogger }` | 与 b85f3ac7 保持一致 |
| canvasLogger 模式 | `.default.error()` | b85f3ac7 确立的模式 |

**canvasLogger 实现确认**:
- 路径: `vibex-fronted/src/lib/canvas/canvasLogger.ts` (已存在)
- 类型: 有 `.default` 导出，包含 `.error()`, `.warn()`, `.info()` 等方法
- dev 模式: 输出到 console，不影响生产

---

## 5. 数据流

```
用户触发导出异常
  ↓
catch (err) {
  canvasLogger.default.error('Export failed:', err);  ← 使用已导入的 canvasLogger
  alert('导出失败，请重试');
}
  ↓
canvasLogger (dev 模式) → console.error 输出日志
  ↓
用户看到 alert 提示
```

---

## 6. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 误引入 console.error | 低 | b85f3ac7 已建立 no-console 规范，添加 import 符合规范 |
| 破坏导出功能 | 无 | 仅添加 import，不修改任何逻辑 |
| TypeScript 类型错误 | 无 | canvasLogger 类型定义已存在 |

**性能影响**: 零。无新增计算，无新增网络请求。

---

## 7. 验收标准

| ID | 标准 | 验证方式 |
|----|------|----------|
| AC1.1 | canvasLogger import 存在于文件前 10 行 | `head -10 src/app/export/page.tsx \| grep canvasLogger` |
| AC1.2 | 构建无 canvasLogger ReferenceError | `npm run build` 无 "canvasLogger is not defined" |
| AC1.3 | TypeScript 类型检查通过 | `npx tsc --noEmit` exit code = 0 |
| AC1.4 | 导出异常路径 alert 仍正常 | 手动测试导出异常场景 |

---

## 8. 变更范围

| 文件 | 修改类型 | 修改量 |
|------|----------|--------|
| `src/app/export/page.tsx` | 添加 1 行 import | +1 行 |

---

## 9. 技术审查记录

### 审查结论
- ✅ 根因分析准确：缺少顶层 import
- ✅ 修复方案最小化：仅 +1 行
- ✅ 与项目规范一致：遵循 b85f3ac7 的 canvasLogger 模式
- ✅ 无额外依赖引入
- ✅ 风险为零

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-canvaslogger-fix-20260407
- **执行日期**: 2026-04-07
