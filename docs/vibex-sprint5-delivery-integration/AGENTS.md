# AGENTS.md — vibex-sprint5-delivery-integration

**项目**: vibex-sprint5-delivery-integration
**日期**: 2026-04-18
**角色**: Architect
**受众**: Dev Agent、Review Agent、QA Agent

---

## 开发约束

### 架构约束

- **Sprint1/Sprint2/4 优先复用**: 所有数据来自现有 store，不创建新的数据源
- `deliveryStore` 是唯一被修改的 store，其余 store 只读
- 数据转换函数统一放在 `src/lib/delivery/` 目录
- **DDLGenerator 放在 `src/lib/delivery/`**（不是 `lib/contract/`）

### 数据转换约束

- `toComponent()`: 从 `prototypeStore.getExportData().nodes` 读取，不修改 prototypeStore
- `toBoundedContext()`: 从 `DDSCanvasStore.chapters.context.cards` 读取，不修改 DDSCanvasStore
- `toBusinessFlow()`: 从 `DDSCanvasStore.chapters.flow.cards` 读取
- `toStateMachine()`: 从 `DDSCanvasStore.chapters.businessRules.cards` 读取
- 所有转换必须可逆（单向聚合展示，非双向同步）

### 跨画布导航约束

- DeliveryNav 作为独立组件，不修改 ProtoEditor 或 DDSCanvas
- 导航使用 Next.js `Link` 组件
- 不在 ProtoEditor 或 DDSCanvas 中添加指向 DeliveryCenter 的链接（解耦）

### DDL 生成约束

- **只生成 DDL 文件，不执行 SQL**
- DDLGenerator 调用 `APICanvasExporter.exportToOpenAPI()`（Sprint4）获取 API 端点
- 不修改 Sprint4 的 OpenAPIGenerator 或 APICanvasExporter
- 支持 MySQL 格式（默认），可扩展 PostgreSQL/SQLite

### Mock 数据约束

- **保留 mock 数据作为 fallback**：当 prototypeStore 或 DDSCanvasStore 数据为空时，使用 mock 数据
- fallback 条件：store 初始化前、projectId 未设置、无数据时
- fallback 不报错，显示友好提示

### 测试要求

- **Vitest + Testing Library**（项目基准）
- 数据转换函数（toComponent / toBoundedContext / toBusinessFlow / toStateMachine）：每个 ≥ 3 个测试用例
- DDLGenerator：≥ 5 个测试用例
- TypeScript 编译 0 errors

### 四态设计

每个视图必须实现四态：
- **Ideal**: 正常渲染
- **Empty**: 引导内容（非留白）——"暂无数据，请先在 [画布名] 中添加"
- **Loading**: 骨架屏（**禁止**转圈）
- **Error**: 内联错误提示 + 重试按钮

### 不在本期处理

- DDL 智能推断（复杂类型映射）
- 跨画布状态双向同步
- StateMachine 可视化编辑器
- PRD 自动生成
- DDL 直接执行

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint5-delivery-integration
- **执行日期**: 2026-04-18
- **备注**: E3 (DDL 生成) BLOCKED — 等待 Sprint4 api 章节实现
