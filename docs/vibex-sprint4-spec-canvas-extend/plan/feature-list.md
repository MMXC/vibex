# Feature List — vibex-sprint4-spec-canvas-extend

**项目**: vibex-sprint4-spec-canvas-extend
**阶段**: Planning (create-prd)
**日期**: 2026-04-18
**上游**: analysis.md (2026-04-18)

---

## 1. Feature List 表格

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| F-A.1 | API 组件面板 | 左侧展示 GET/POST/PUT/DELETE/PATCH 5 种端点组件卡片 | Analyst: A1 | 1h |
| F-A.2 | APIEndpointCard 节点 | 自定义 React Flow 节点，显示 method badge + path + summary | Analyst: A2 | 2h |
| F-A.3 | API 属性面板 | 右侧配置 path/method/summary，修改后节点标签实时更新 | Analyst: A3 | 3h |
| F-A.4 | 参数配置 | Query/Header/Path 参数 table 形式增删改 | Analyst: A4 | 2h |
| F-A.5 | Schema 编辑器 | 请求体/响应体 JSON textarea 编辑（MVP 方案A） | Analyst: A5 | 3h |
| F-A.6 | OpenAPI 导出 | 调用 OpenAPIGenerator 生成符合 OpenAPI 3.0 的 JSON/YAML | Analyst: A6 | 2h |
| F-A.7 | API 章节持久化 | DDSCanvasStore 增加 api chapter，刷新后数据保留 | Analyst: A7 | 2h |
| F-B.1 | 状态机组件面板 | 左侧展示 state/transition/choice 3 种组件 | Analyst: B1 | 1h |
| F-B.2 | StateMachineCard 节点 | 自定义节点，显示状态名 + 类型图标（initial/final/normal/choice/join/fork） | Analyst: B2 | 3h |
| F-B.3 | 状态属性面板 | stateId/stateType/events 配置，状态类型选择 | Analyst: B3 | 2h |
| F-B.4 | 转移配置面板 | guard/action/target 配置抽屉，连线边选择后打开 | Analyst: B4 | 3h |
| F-B.5 | 状态机 JSON 导出 | 导出为结构化 JSON（含 states/initial/transitions） | Analyst: B5 | 2h |
| F-B.6 | XState 格式导出 | 生成合法的 XState machine config（MVP 降级为 JSON） | Analyst: B6 | 3h |
| F-B.7 | 业务规则章节持久化 | DDSCanvasStore 增加 businessRules chapter | Analyst: B7 | 2h |
| F-C.1 | API → Requirement 跨章节边 | 从 APIEndpointCard 画边到 UserStoryCard | Analyst: C1 | 2h |
| F-C.2 | StateMachine → Context 跨章节边 | 从 StateMachineCard 画边到 BoundedContextCard | Analyst: C2 | 2h |
| F-C.3 | 章节切换器扩展 | DDSToolbar 显示 5 章节，URL 支持 | Analyst: C3 | 1h |
| F-C.4 | 章节显示管理 | 5 章节可选显示，toolbar 切换 | Analyst: C4 | 1h |
| F-D.1 | API 章节状态规范 | 骨架屏/空状态/加载态/错误态 | Analyst: D1 | 1h |
| F-D.2 | StateMachine 章节状态规范 | 骨架屏/空状态/加载态/错误态 | Analyst: D2 | 1h |
| F-D.3 | 导出失败处理 | toast 错误提示 | Analyst: D3 | 0.5h |
| F-E.1 | APIEndpointCard 单元测试 | 10+ 测试用例 | Analyst: E1 | 1h |
| F-E.2 | StateMachineCard 单元测试 | 10+ 测试用例 | Analyst: E2 | 1h |
| F-E.3 | OpenAPI Export E2E 测试 | 拖拽到导出完整流程 | Analyst: E3 | 1h |
| F-E.4 | StateMachine Export E2E 测试 | 拖拽到导出完整流程 | Analyst: E4 | 1h |

---

## 2. Epic/Story 映射

| Epic | Story | 功能 | 优先级 |
|------|-------|------|--------|
| E1 | A1 | API 组件面板 | P0 |
| E1 | A2 | APIEndpointCard 节点 | P0 |
| E1 | A3 | API 属性面板 | P0 |
| E1 | A4 | 参数配置 | P1 |
| E1 | A5 | Schema 编辑器 | P1 |
| E1 | A6 | OpenAPI 导出 | P0 |
| E1 | A7 | API 章节持久化 | P0 |
| E2 | B1 | 状态机组件面板 | P0 |
| E2 | B2 | StateMachineCard 节点 | P0 |
| E2 | B3 | 状态属性面板 | P0 |
| E2 | B4 | 转移配置面板 | P1 |
| E2 | B5 | 状态机 JSON 导出 | P0 |
| E2 | B6 | XState 格式导出 | P2 |
| E2 | B7 | 业务规则章节持久化 | P0 |
| E3 | C1 | API → Requirement 跨章节边 | P1 |
| E3 | C2 | StateMachine → Context 跨章节边 | P1 |
| E3 | C3 | 章节切换器扩展 | P1 |
| E3 | C4 | 章节显示管理 | P2 |
| E4 | D1~D3 | 状态与错误处理 | P0 |
| E5 | E1~E4 | 测试覆盖 | P0 |

---

## 3. 已知 GAP 及处理

| GAP | 描述 | 处理方式 |
|-----|------|---------|
| Schema 编辑复杂度高 | MVP 方案A（自由 JSON textarea）避免 Schema 选择器 | Analyst 建议，PM 采纳 |
| XState 格式生成 | MVP 降级为 JSON 导出，XState 后续迭代 | B6 标记 P2 |
| StateMachine 与 Flow 混淆 | UI 上明确区分概念，提供引导文案 | specs 中明确 |
| DDSCanvasStore 膨胀 | 监控 store 行数，超 500 行则拆分 | 架构设计约束 |
