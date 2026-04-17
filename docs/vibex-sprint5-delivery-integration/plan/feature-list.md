# Feature List — vibex-sprint5-delivery-integration

**项目**: vibex-sprint5-delivery-integration
**阶段**: Planning (create-prd)
**日期**: 2026-04-18
**上游**: analysis.md (2026-04-18)

---

## 1. Feature List 表格

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| F-A.1 | deliveryStore 真实数据加载 | loadMockData() → 真实数据拉取，替换 mock data | Analyst: A1 | 2h |
| F-A.2 | ProtoNode → Component 转换 | prototypeStore.getExportData() → Component[] | Analyst: A2 | 1h |
| F-A.3 | DDSCanvasStore → Context/Flow 转换 | ddsCanvasStore → BoundedContext[] / BusinessFlow[] | Analyst: A3 | 1h |
| F-A.4 | PRD 自动生成 | 从 prototype nodes + DDS cards 生成 PRD 大纲 | Analyst: A4 | 3h |
| F-B.1 | ProtoEditor → DDS Canvas 跳转 | 节点右键菜单 "查看上下文" → router.push | Analyst: B1 | 1h |
| F-B.2 | DDS Canvas → ProtoEditor 跳转 | BoundedContextCard "查看原型" → router.push | Analyst: B2 | 1h |
| F-B.3 | Toolbar 导出入口 | DDSToolbar + ProtoEditor toolbar 增加导出按钮 | Analyst: B3 | 1h |
| F-B.4 | Delivery Center 返回按钮 | 返回编辑按钮，保留当前数据上下文 | Analyst: B4 | 1h |
| F-C.1 | DDL 生成器 | BoundedContextCard → SQL DDL 字符串（方案A：表级） | Analyst: C1 | 3h |
| F-C.2 | ComponentTab 真实数据 | 组件列表显示真实 ProtoNode，替换 mock | Analyst: C2 | 2h |
| F-C.3 | OpenAPI Tab 集成 | Sprint4 APICanvasExporter → Delivery Center API Tab | Analyst: C3（依赖 Sprint4）| 2h |
| F-C.4 | DeliveryTabs 5 Tab | 章节/流程/组件/PRD/API（5个Tab） | Analyst: C4 | 1h |
| F-C.5 | 批量导出 ZIP | 组件规格 + OpenAPI + DDL + PRD → ZIP 下载 | Analyst: C5 | 2h |
| F-D.1 | PRD Tab 真实数据 | PRD 内容从 prototype + DDS 实时生成 | Analyst: D1 | 3h |
| F-D.2 | PRD Markdown 导出 | 支持导出为 .md 文件 | Analyst: D2 | 1h |
| F-D.3 | PRD 预览编辑器 | PRDTab 内嵌 Markdown 预览/编辑 | Analyst: D3 | 2h |
| F-E.1 | 空数据引导 | Delivery Center 无数据时显示引导文案 | Analyst: E1 | 1h |
| F-E.2 | 导出失败 toast | 导出错误友好提示 | Analyst: E2 | 1h |
| F-E.3 | 加载骨架屏 | 数据加载时骨架屏替代转圈 | Analyst: E3 | 1h |

---

## 2. Epic/Story 映射

| Epic | Story | 功能 | 优先级 |
|------|-------|------|--------|
| E1 | A1+A2+A3 | 数据层集成（真实数据替换 mock） | P0 |
| E1 | A4 | PRD 自动生成 | P1 |
| E2 | B1+B2+B3+B4 | 双向跳转（Canvas ↔ Delivery Center） | P1 |
| E3 | C1+C2+C4 | 交付导出器基础（DDL + ComponentTab） | P0 |
| E3 | C3 | OpenAPI Tab（Sprint4 依赖） | P0 |
| E3 | C5 | 批量导出 ZIP | P2 |
| E4 | D1+D2+D3 | PRD 融合 | P1 |
| E5 | E1+E2+E3 | 状态与错误处理 | P0 |

---

## 3. Sprint4 依赖处理

| Sprint4 功能 | Sprint5 依赖点 | 处理方式 |
|-------------|--------------|---------|
| APICanvasExporter | F-C.3 (OpenAPI Tab) | 检测存在性，不存在时隐藏 API Tab |
| APIEndpointCard 类型 | F-C.3 | types/dds/index.ts 中已有定义则复用 |
| ChapterType 'api' | F-C.4 | 条件渲染，api chapter 不存在时降级 |

---

## 4. 已知 GAP 处理

| GAP | 描述 | 处理方式 |
|-----|------|---------|
| DDSCanvasStore 无 getExportData | store 直接暴露 chapters 结构 | F-A.3 直接访问 chapters，不需要单独 export |
| DDL 粒度不明确 | 表级 vs 字段级 | 方案A（表级 MVP），字段级暂缓 |
| PRD 生成质量不确定 | AI vs 人工 | 方案A（半自动：结构化输出+人工补充） |
| Sprint4 延迟影响 C3 | C3 依赖 Sprint4 | 条件渲染，降级为 4 Tab |
