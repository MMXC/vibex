# vibex-design-component-library — Planning

**项目**: vibex-design-component-library
**日期**: 2026-04-14
**作者**: PM Agent
**基于**: analysis.md

---

## 执行摘要

构建一套工具链，将 `awesome-design-md-cn` 的 59 套设计风格转换为 json-render catalog JSON 文件，供 AI 在生成组件时选择和匹配风格。分析阶段已确认方案 A（Node.js 脚本 + 静态 JSON）为最优路径。

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | generate-catalog 脚本开发 | Node.js 脚本读取 designs.json + DESIGN.md，解析 token，输出 catalog JSON | 核心工具 | 1d |
| F1.2 | 3 个示例 catalog 输出 | airbnb / linear.app / stripe 三套风格 catalog 验证 | F1.1 | 0.5d |
| F1.3 | StyleCatalog Schema 定义 | TypeScript 接口定义，统一 catalog JSON 结构 | F1.1 | 0.25d |
| F1.4 | 回归防护 | 脚本输出验证、schema 版本兼容、JSON 解析检查 | 风险缓解 | 0.25d |
| F2.1 | 批量生成脚本 | `--all` 参数批量生成 59 套 catalog | F1.1 | 0.5d |
| F2.2 | 风格特征组件 Schema | 每个风格 2-3 个特征组件的 schema 定义 | 手工产出 | 0.5d |
| F3.1 | AI 标签匹配流程设计 | 用户输入 → 标签匹配 → catalog 选择全链路设计 | 独立任务 | 待定 |

---

## Epic 拆分

### Epic 1 — 工具链构建（Phase 1，P0）

**目标**: 脚本可执行 + 3 个示例 catalog 验证，工时合计 2d。

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|----------|------|
| S1.1 | StyleCatalog Schema 定义 | TypeScript 接口存在，json-render 版本字段，catalog.components 结构 | 0.25d |
| S1.2 | generate-catalog 脚本 | 读取 designs.json / DESIGN.md，解析 token，输出 JSON | 1d |
| S1.3 | 3 个示例 catalog 输出 | airbnb / linear.app / stripe 三个 catalog JSON 验证通过 | 0.5d |
| S1.4 | 回归防护 | 输出 JSON 解析检查，script < 5s，不修改现有 catalog.ts | 0.25d |

### Epic 2 — 规模化（Phase 2，P1）

**目标**: 批量生成 + 风格特征组件，工时合计 1d。

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|----------|------|
| S2.1 | 批量生成脚本 | `generate-catalog --all` 覆盖 59 套风格，输出到 catalogs/ | 0.5d |
| S2.2 | 风格特征组件 Schema | 每个风格 2-3 个特征组件的 catalog 定义 | 0.5d |

### Epic 3 — AI 标签匹配（Phase 3，待定）

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|----------|------|
| S3.1 | AI 标签匹配流程设计 | 设计文档：用户输入 → 标签匹配 → catalog 选择 | 待定 |

---

## 依赖关系

```
Epic 1
├── S1.1 StyleCatalog Schema ← 独立
├── S1.2 脚本开发 ← 依赖 S1.1
├── S1.3 示例输出 ← 依赖 S1.2
└── S1.4 回归防护 ← 依赖 S1.2+S1.3

Epic 2 — 依赖 Epic 1 完成
├── S2.1 批量生成 ← 依赖 S1.2
└── S2.2 风格特征组件 ← 依赖 S1.3

Epic 3 — 独立，可并行设计
```

---

## 关键风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| DESIGN.md 结构不一致（token 格式差异） | 中 | 中 | 分层解析 + fallback 正则；前 3 个示例人工 review |
| 风格特征组件映射的主观性 | 高 | 中 | Phase 1 不生成风格特征组件，Phase 2 手工产出 |
| catalog 运行时加载 | 中 | 中 | 按需 lazy load，不全量加载 |

---

*PM Agent — 2026-04-14*
