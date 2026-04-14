# vibex-design-component-library — 项目经验沉淀

**项目完成时间**: 2026-04-14
**Epic 总数**: 4 个（Epic1 Phase1 P0、Epic2 Phase2 P1、Epic1-Stories、Epic2-Stories）

## 项目概述

建立 vibex 前端设计组件库基础设施：
- 设计文件解析（design-parser.ts）：解析 Figma/设计稿导出格式
- 组件目录生成（generate-catalog.ts）：批量生成 58 个组件 catalog JSON
- 设计规范管理：统一 design tokens、typography、component tokens

## 核心技术决策

### 1. parser 集成到 generate-catalog
**决策**: 在 generate-catalog.ts 中集成 design-parser，一次遍历完成解析+写入
**理由**: 避免二次读取文件，减少 I/O，parser 输出直接映射到 catalog 字段
**结果**: 58 个 catalog 全部补充 colorPalette/typography/catalog.components/styleComponents

### 2. Vitest 单元测试覆盖
**决策**: 每个 Epic 必须有对应测试（Vitest）
**Epic1-Stories**: 52 tests → da11de72
**Epic2-Stories**: 19 tests → 3bad72a2
**验证**: vitest 71/71 通过

### 3. CHANGELOG.md 同步更新
**决策**: 每个 Epic 完成后同步更新 CHANGELOG.md（commit message 包含 "docs: update changelog"）
**规范**: 每个 changelog entry 包含：提交 hash、功能描述、验证结果

## 踩过的坑

### 1. design-parser `### Heading` 格式解析
**问题**: parser 原始实现无法解析 `### Section` 三级标题格式
**修复**: 新增 extractSection() helper，支持 #/##/### 多级标题递归解析
**验证**: 58 个 catalog 全量回归通过

### 2. styleComponents 字段生成
**问题**: 每个 catalog 的 styleComponents 需要包含 5 个必需字段（displayName/description/category/type/variants）
**修复**: 为 58 个 catalog 各生成 2-3 个标准组件（基础组件 + 业务组件组合）
**验证**: styleComponents 58/58 通过

### 3. vitest 配置 ERR_LOAD_URL
**问题**: vitest 自定义 reporter 配置错误导致 RunnerError
**原因**: reporter 模块路径配置问题
**状态**: 测试脚本通过 test-with-exit-code.js 执行，tester 已验证 71/71 通过

## 可复用模式

1. **批量生成模式**: `--all` 标志触发全量处理，配合 `--slug` 单个生成
2. **错误跳过策略**: 单个文件解析失败不影响其他文件，最终汇总错误数量
3. **测试先行**: Epic-Stories 开发前先写测试，测试驱动功能实现
4. **CHANGELOG 同步**: commit 前检查 CHANGELOG 是否需要更新

## 项目结构

```
vibex-design-component-library/
├── design-parser.ts          # 设计稿解析器
├── generate-catalog.ts       # catalog 批量生成脚本
├── registry.tsx              # 组件注册表
├── catalog.ts                # catalog 容器组件定义
├── tests/
│   ├── design-catalog.test.ts    # Epic1 52 tests
│   └── generate-catalog.test.ts  # Epic2 19 tests
└── catalogs/                  # 58 个组件 catalog JSON
```

## 经验教训

1. **设计解析标准化**: design-parser 应与设计稿导出格式严格对齐，任何格式变更需要同步更新 parser
2. **测试覆盖边界条件**: 不仅测正常路径，还要测错误路径（文件不存在、格式异常、空数据）
3. **一次性 commit 完整性**: changelog + 代码 + 测试应在一个 commit 内完成，避免分散

---
*沉淀时间: 2026-04-14*
