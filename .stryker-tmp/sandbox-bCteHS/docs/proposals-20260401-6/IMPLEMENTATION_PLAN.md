# Implementation Plan — proposals-20260401-6

**项目**: proposals-20260401-6 — 全面收尾 + 质量加固
**角色**: Solution Architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 执行摘要

本实施计划基于 10h 总工时预算，将三个 Epic 拆解为 8 个可执行任务，总工时分配如下:

| Epic | 任务 | 工时 | 优先级 | 执行顺序 |
|------|------|------|--------|----------|
| E1 | PNG 导出实现 | 1.5h | P1 | 1 |
| E1 | SVG 导出实现 | 1.0h | P1 | 2 |
| E1 | ZIP 批量导出 | 1.0h | P1 | 3 |
| E1 | E2E 测试覆盖 | 0.5h | P1 | 4 |
| E2 | TS 严格模式检查 | 1.0h | P1 | 5 (并行) |
| E2 | ESLint 检查 | 1.0h | P1 | 5 (并行) |
| E2 | 键盘冲突检查 | 1.0h | P1 | 5 (并行) |
| E2 | 内存泄漏检查 | 1.0h | P1 | 5 (并行) |
| E3 | 用户手册编写 | 1.5h | P2 | 6 |
| E3 | /help 端点实现 | 0.5h | P2 | 7 |
| **合计** | | **10.0h** | | |

---

## Sprint 6 排期 (2 天)

```
Day 1 (6h)                              Day 2 (4h)
┌──────────────────────────┐            ┌──────────────────────────┐
│ E1: PNG Export     1.5h   │            │ E2: Code Quality   4.0h  │
│ E1: SVG Export    1.0h   │            │   TS Check        1.0h   │
│ E1: ZIP Export     1.0h   │            │   ESLint          1.0h   │
│ E1: E2E Tests      0.5h   │            │   Keyboard        1.0h   │
│ E3: User Guide     1.5h   │            │   Memory Leak     1.0h   │
│ E3: /help Endpoint 0.5h   │            └──────────────────────────┘
└──────────────────────────┘

Timeline:
[Day 1 AM] E1: PNG + SVG            [Day 2 AM] E2: TS + ESLint
[Day 1 PM] E1: ZIP + E2E            [Day 2 PM] E2: KB + Mem + Review
        E3: User Guide + /help
```

---

## Epic 1 详细实施计划 (4h)

### Task E1-T1: PNG 导出实现 (1.5h)

**负责人**: Dev Agent
**前置依赖**: 无
**验收标准**: `expect(exportOptions).toContain('PNG')`

#### 子步骤

| 步骤 | 操作 | 预估时间 | 产出物 |
|------|------|----------|--------|
| 1.1 | 安装 html2canvas + @types | 10min | package.json 更新 |
| 1.2 | 实现 PNGExporter 类 | 30min | `src/services/export/PNGExporter.ts` |
| 1.3 | 实现 CSS 变量内联工具函数 | 15min | `src/utils/cssInline.ts` |
| 1.4 | 集成到 ExportService Facade | 15min | `src/services/export/ExportService.ts` |
| 1.5 | UI: 导出面板增加 PNG 选项 | 15min | `src/components/ExportPanel.tsx` |
| 1.6 | 单元测试 | 5min | `tests/unit/export/PNGExporter.test.ts` |

#### 实现细节

```typescript
// src/services/export/PNGExporter.ts
import html2canvas from 'html2canvas';
import { inlineCSSVariables } from '../../utils/cssInline';

export class PNGExporter implements IPNGExporter {
  async export(nodeId: string, options: PNGExportOptions): Promise<Blob> {
    const node = this.getNodeById(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);

    const element = this.getDOMElement(node);

    const canvas = await html2canvas(element, {
      scale: options.scale,
      backgroundColor: options.backgroundColor === 'transparent' ? null : options.backgroundColor,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        // 内联 CSS 变量
        const clonedEl = clonedDoc.body.querySelector(`[data-node-id="${nodeId}"]`);
        if (clonedEl) {
          inlineCSSVariables(clonedEl as HTMLElement);
        }
      },
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob(resolve, 'image/png');
    });
  }
}
```

### Task E1-T2: SVG 导出实现 (1.0h)

**负责人**: Dev Agent
**前置依赖**: E1-T1
**验收标准**: `expect(exportOptions).toContain('SVG')`

#### 子步骤

| 步骤 | 操作 | 预估时间 | 产出物 |
|------|------|----------|--------|
| 2.1 | 实现 SVGExporter 类 | 30min | `src/services/export/SVGExporter.ts` |
| 2.2 | 实现 XMLSerializer + CSS 内联 | 20min | SVG Blob 生成逻辑 |
| 2.3 | 集成到 ExportService Facade | 5min | Facade 更新 |
| 2.4 | UI: 导出面板增加 SVG 选项 | 5min | ExportPanel 更新 |

### Task E1-T3: ZIP 批量导出 (1.0h)

**负责人**: Dev Agent
**前置依赖**: E1-T1, E1-T2
**验收标准**: `expect(zipFileName).toMatch(/\.zip$/)`

#### 子步骤

| 步骤 | 操作 | 预估时间 | 产出物 |
|------|------|----------|--------|
| 3.1 | 实现 ZipExporter 类 | 20min | `src/services/export/ZipExporter.ts` |
| 3.2 | 实现 manifest.json 生成 | 10min | 元数据文件 |
| 3.3 | 集成进度回调 (onProgress) | 10min | 实时进度反馈 |
| 3.4 | UI: ZIP 选项 + 全选按钮 | 10min | ExportPanel 更新 |
| 3.5 | 单元测试 | 10min | `tests/unit/export/ZipExporter.test.ts` |

### Task E1-T4: E2E 测试覆盖 (0.5h)

**负责人**: Tester Agent
**前置依赖**: E1-T1, E1-T2, E1-T3
**验收标准**: `expect(testPassed).toBe(true)`

#### 测试用例

| 用例 | 操作 | 断言 |
|------|------|------|
| UC-E1-01 | 打开导出面板 | 选项包含 PNG |
| UC-E1-02 | 打开导出面板 | 选项包含 SVG |
| UC-E1-03 | 选择 ZIP + 点击导出 | 下载文件名为 .zip |
| UC-E1-04 | 选择 PNG + 点击导出 | 下载文件名为 .png |
| UC-E1-05 | 选择 SVG + 点击导出 | 下载文件名为 .svg |

---

## Epic 2 详细实施计划 (4h)

> **并行执行**: E2 的 4 个检查项相互独立，可同时开发。

### Task E2-T1: TypeScript 严格模式检查 (1.0h)

**负责人**: Dev Agent
**前置依赖**: 无
**验收标准**: `expect(tsErrors).toBe(0)`

#### 子步骤

| 步骤 | 操作 | 预估时间 | 产出物 |
|------|------|----------|--------|
| 1.1 | 确认 tsconfig.json strict: true | 5min | tsconfig.json |
| 1.2 | 运行 `npx tsc --noEmit --strict` | 5min | 错误列表 |
| 1.3 | 修复 Batch 1-5 新增代码的 TS 错误 | 35min | 修复后的源文件 |
| 1.4 | 验证 0 error | 5min | CI 绿色 |
| 1.5 | 集成到 CodeQualityChecker | 10min | TSChecker.ts |

#### TS 严格模式配置

```json
// tsconfig.json (relevant sections)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Task E2-T2: ESLint 检查 (1.0h)

**负责人**: Dev Agent
**前置依赖**: 无
**验收标准**: `expect(eslintWarnings).toBe(0)`

#### 子步骤

| 步骤 | 操作 | 预估时间 | 产出物 |
|------|------|----------|--------|
| 2.1 | 确认 .eslintrc 规则配置 | 5min | .eslintrc |
| 2.2 | 运行 `npx eslint src/` | 5min | 警告列表 |
| 2.3 | 修复 Batch 1-5 新增代码的 ESLint 警告 | 35min | 修复后的源文件 |
| 2.4 | 验证 0 warning | 5min | CI 绿色 |
| 2.5 | 集成到 CodeQualityChecker | 10min | ESLintChecker.ts |

### Task E2-T3: 键盘冲突检查 (1.0h)

**负责人**: Dev Agent
**前置依赖**: 无
**验收标准**: `expect(hasConflict).toBe(false)` (Ctrl+G / Alt+1/2/3)

#### 子步骤

| 步骤 | 操作 | 预估时间 | 产出物 |
|------|------|----------|--------|
| 3.1 | 分析 shortcuts.ts 中的快捷键定义 | 15min | shortcuts-map |
| 3.2 | 实现 KeyboardConflictChecker | 20min | `src/services/code-quality/KeyboardChecker.ts` |
| 3.3 | 检测 Ctrl+G 冲突 | 10min | 冲突报告 |
| 3.4 | 检测 Alt+1/2/3 冲突 | 10min | 冲突报告 |
| 3.5 | 修复发现的冲突 | 5min | shortcuts.ts |

#### 冲突修复策略

```typescript
// 典型冲突场景与修复
// 场景 1: Ctrl+G 在 global 和 canvas scope 冲突
// 修复: global scope 改为 Ctrl+Shift+G

// 场景 2: Alt+1 在不同面板冲突
// 修复: 限制特定 panel 内的 Alt+1 响应
```

### Task E2-T4: 内存泄漏检查 (1.0h)

**负责人**: Dev Agent
**前置依赖**: 无
**验收标准**: `expect(hasLeak).toBe(false)`

#### 子步骤

| 步骤 | 操作 | 预估时间 | 产出物 |
|------|------|----------|--------|
| 4.1 | 扫描代码中的 requestAnimationFrame | 15min | rAF 位置列表 |
| 4.2 | 扫描代码中的 addEventListener | 15min | 事件监听列表 |
| 4.3 | 实现 MemoryLeakChecker | 15min | `src/services/code-quality/MemoryLeakChecker.ts` |
| 4.4 | 验证每个 rAF 有 cancelAnimationFrame | 10min | 清理报告 |
| 4.5 | 验证每个 addEventListener 有 removeEventListener | 5min | 清理报告 |

#### 检测规则

```typescript
// MemoryLeakChecker 检测模式
const rafPattern = /requestAnimationFrame\s*\(/g;
const cancelRafPattern = /cancelAnimationFrame\s*\(/g;

const addEventPattern = /addEventListener\s*\(/g;
const removeEventPattern = /removeEventListener\s*\(/g;

// 每个 requestAnimationFrame 必须在同一作用域/函数中有对应的 cancelAnimationFrame
// 每个 addEventListener 必须在组件卸载时有对应的 removeEventListener
```

---

## Epic 3 详细实施计划 (2h)

### Task E3-T1: 用户手册编写 (1.5h)

**负责人**: Dev Agent
**前置依赖**: 无
**验收标准**: `expect(exists('docs/user-guide.md')).toBe(true)` + 操作数 >= 5

#### 用户手册结构 (目标 >= 10 章节, >= 5 操作)

```markdown
# VibeX 用户手册

## 目录
1. [画布操作](#画布操作)       ← 操作: 平移、缩放、重置
2. [节点管理](#节点管理)       ← 操作: 创建、编辑、删除、复制
3. [导出功能](#导出功能)       ← 操作: PNG 导出、SVG 导出、ZIP 批量导出
4. [快捷键](#快捷键)          ← 操作: 全局快捷键、自定义快捷键
5. [设置](#设置)              ← 操作: 主题切换、语言切换
6. [故障排除](#故障排除)      ← 操作: 清除缓存、报告问题

## 1. 画布操作
### 1.1 平移画布
### 1.2 缩放画布
### 1.3 重置视图

## 2. 节点管理
### 2.1 创建节点
### 2.2 编辑节点
### 2.3 删除节点
### 2.4 复制节点

## 3. 导出功能
### 3.1 PNG 导出
### 3.2 SVG 导出
### 3.3 ZIP 批量导出

## 4. 快捷键
### 4.1 全局快捷键
### 4.2 自定义快捷键

## 5. 设置
### 5.1 主题切换
### 5.2 语言切换

## 6. 故障排除
### 6.1 清除缓存
### 6.2 报告问题
```

#### 子步骤

| 步骤 | 操作 | 预估时间 | 产出物 |
|------|------|----------|--------|
| 1.1 | 创建 docs/user-guide.md | 5min | 初始文件 |
| 1.2 | 编写画布操作章节 (3 操作) | 20min | 章节内容 |
| 1.3 | 编写节点管理章节 (4 操作) | 20min | 章节内容 |
| 1.4 | 编写导出功能章节 (3 操作) | 20min | 章节内容 (E1 完成后) |
| 1.5 | 编写快捷键章节 (2 操作) | 10min | 章节内容 |
| 1.6 | 编写设置章节 (2 操作) | 10min | 章节内容 |
| 1.7 | 编写故障排除章节 | 5min | 章节内容 |
| 1.8 | 验证操作数 >= 5 | 5min | 文档审查 |

### Task E3-T2: /help 端点实现 (0.5h)

**负责人**: Dev Agent
**前置依赖**: E3-T1
**验收标准**: `expect(helpEndpoint.exists).toBe(true)`

#### 子步骤

| 步骤 | 操作 | 预估时间 | 产出物 |
|------|------|----------|--------|
| 2.1 | 实现 HelpRouter | 10min | `src/services/documentation/HelpRouter.ts` |
| 2.2 | 实现 /help GET 端点 | 10min | 路由注册 |
| 2.3 | UI: Help 按钮链接到 /help | 5min | 导航更新 |
| 2.4 | E2E 测试 | 5min | `tests/e2e/documentation/help-endpoint.spec.ts` |

---

## 验收检查清单

### Epic 1 验收

- [ ] 导出面板显示 PNG 选项
- [ ] 导出面板显示 SVG 选项
- [ ] PNG 导出生成有效的 .png 文件
- [ ] SVG 导出生成有效的 .svg 文件
- [ ] ZIP 导出生成有效的 .zip 文件
- [ ] ZIP 包含 manifest.json
- [ ] 批量导出进度条正常工作
- [ ] Playwright E2E 测试全部通过

### Epic 2 验收

- [ ] `npx tsc --noEmit` 输出 0 error
- [ ] `npx eslint src/` 输出 0 warning
- [ ] Ctrl+G 无键盘冲突
- [ ] Alt+1/2/3 无键盘冲突
- [ ] 所有 requestAnimationFrame 有对应 cancelAnimationFrame
- [ ] 所有 addEventListener 有对应 removeEventListener
- [ ] CodeQualityChecker.runAllChecks() 返回 overall: 'pass'

### Epic 3 验收

- [ ] docs/user-guide.md 存在
- [ ] 文档包含 >= 10 章节
- [ ] 文档包含 >= 5 个操作说明
- [ ] /help GET 端点返回 200
- [ ] UI Help 按钮正确链接到 /help
- [ ] E2E 测试 /help 页面正常显示

---

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| html2canvas 对复杂 SVG 支持差 | 中 | 高 | E1: 先 SVG 后 PNG，SVG 兜底 |
| 批量导出内存峰值超限 | 中 | 中 | E1: 分批处理 + Web Worker |
| 键盘快捷键与浏览器冲突 | 低 | 高 | E2: 明确 reserved keys 列表 |
| E3 文档与实际功能不同步 | 低 | 中 | E3: 文档与代码 PR 绑定审查 |
| TS strict 模式引入大量错误 | 高 | 中 | E2: 提前扫描，设置修复计划 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: proposals-20260401-6
- **执行日期**: 2026-04-01
