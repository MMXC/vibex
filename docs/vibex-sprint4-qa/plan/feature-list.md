# Feature List — vibex-sprint4-qa

**项目**: vibex-sprint4-qa
**阶段**: Planning (create-prd)
**日期**: 2026-04-18
**上游**: analysis.md (2026-04-18)

---

## 1. Feature List 表格（QA 验证项）

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| F-QA.1 | APIEndpointCard 类型验证 | types/dds/index.ts 存在 APIEndpointCard 接口定义 | Analyst Gap: 类型定义缺失 | 0.5h |
| F-QA.2 | StateMachineCard 类型验证 | types/dds/index.ts 存在 StateMachineCard 接口定义 | Analyst Gap: 类型定义缺失 | 0.5h |
| F-QA.3 | Schema 适配层验证 | APICanvasExporter.ts 能正确适配 JSON Schema → OpenAPI 3.0 | Analyst Gap: Zod/JSON Schema 不匹配 | 1h |
| F-QA.4 | ChapterType 扩展验证 | ChapterType 包含 'api' 和 'businessRules' 两个新成员 | Analyst: 接口兼容性 | 0.5h |
| F-QA.5 | DDSToolbar CHAPTER_LABELS 扩展验证 | DDSToolbar 显示 5 个章节标签 | Analyst: 硬编码检查 | 0.5h |
| F-QA.6 | initialChapters 扩展验证 | DDSCanvasStore 包含 api 和 businessRules 初始章节 | Analyst: 硬编码检查 | 0.5h |
| F-QA.7 | CrossChapterEdgesOverlay 跨章节边验证 | API→Requirement / SM→Context 跨章节边渲染正确 | Analyst: C1/C2 | 1h |
| F-QA.8 | OpenAPIGenerator 直接复用验证 | APICanvasExporter 不修改 OpenAPIGenerator 源码 | Analyst: 资产复用 | 0.5h |
| F-QA.9 | StateMachine JSON 导出验证 | exportToStateMachine() 输出含 initial/states | Analyst: B5 | 0.5h |
| F-QA.10 | Sprint4-spec PRD 覆盖验证 | prd.md 中 E1/E2 Epic 有完整验收标准 | Analyst: 规格完整性 | 1h |
| F-QA.11 | E2E 测试覆盖验证 | APIEndpointCard + StateMachineCard 单元测试存在 | Analyst: E1/E2 | 1h |
| F-QA.12 | 导出器方案验证 | OpenAPIGenerator 支持 JSON Schema（方案C: patch Spec） | Analyst: 方案选择 | 0.5h |

---

## 2. Epic/Story 映射（QA 视角）

| Epic | Story | 验证内容 | 优先级 |
|------|-------|---------|--------|
| E1 | QA-T1 | APIEndpointCard 类型定义完整 | P0 |
| E1 | QA-T2 | APIEndpointCard 参数/响应结构定义 | P0 |
| E2 | QA-T3 | StateMachineCard 类型定义完整 | P0 |
| E2 | QA-T4 | StateMachine 6 种状态类型定义 | P0 |
| E3 | QA-T5 | Schema 适配层存在且正确 | P0 |
| E3 | QA-T6 | OpenAPI 导出无 Zod 依赖 | P0 |
| E4 | QA-T7 | DDSToolbar 5 章节标签 | P0 |
| E4 | QA-T8 | DDSCanvasStore initialChapters 扩展 | P0 |
| E5 | QA-T9 | CrossChapterEdgesOverlay 跨章节边 | P1 |
| E5 | QA-T10 | Sprint4 PRD 验收标准覆盖 | P0 |
| E6 | QA-T11 | E2E 测试覆盖（APIEndpointCard + StateMachineCard） | P0 |

---

## 3. 已知 GAP 处理

| GAP | 描述 | 处理方式 |
|-----|------|---------|
| APIEndpointCard 类型未定义 | analysis Gap | F-QA.1 + F-QA.2 验证 PRD 中已补充定义 |
| StateMachineCard 类型未定义 | analysis Gap | F-QA.3 + F-QA.4 验证 PRD 中已补充定义 |
| JSON Schema → Zod 不匹配 | OpenAPIGenerator 用 Zod，Sprint4 用 JSON Schema | F-QA.5 + F-QA.12 验证方案C（patch Spec）可行 |
| CHAPTER_LABELS 硬编码 | DDSToolbar.tsx:21 硬编码 3 章节 | F-QA.7 验证需修改 |
| initialChapters 硬编码 | DDSCanvasStore 硬编码 3 章节 | F-QA.8 验证需修改 |
