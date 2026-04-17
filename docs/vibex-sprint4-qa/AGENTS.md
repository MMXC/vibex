# AGENTS.md — vibex-sprint4-qa

**项目**: vibex-sprint4-qa
**日期**: 2026-04-18
**版本**: v2.0
**角色**: Architect（Technical Design + Eng Review）
**受众**: Dev Agent、Review Agent、QA Agent

---

## 项目背景

`sprint4-qa` 是对 `vibex-sprint4-spec-canvas-extend` 设计产出的**技术审查任务**。审查 spec-canvas-extend 的 architecture.md 是否可行，有哪些被低估或遗漏的实现细节。

**核心问题**: 实际代码（`src/`）与 spec 目标之间存在哪些 GAP？技术方案是否可行？

---

## 关键发现（技术审查结论）

> ⚠️ **审查结论: 需要修改** — 发现 7 个技术问题（3 P0 / 4 P1）

### P0 阻塞项（实现前必须修复）

1. **`ChapterType` 缺 `businessRules`** — `types/dds/index.ts` 当前 4 成员，缺 `'businessRules'`
2. **`CardType` 缺 `state-machine`** — `types/dds/index.ts` 当前 4 成员，缺 `'state-machine'`
3. **`state-machine.ts` 类型文件不存在** — `types/dds/` 下无此文件

### P0 技术冲突（Exporter 实现时必须处理）

4. **HTTPMethod 大小写冲突** — `api-endpoint.ts` 定义大写（`'GET'`），OpenAPIGenerator 期望小写（`'get'`）。Exporter 必须执行 `.toLowerCase()`
5. **JSON Schema 存储格式** — `requestBody.schema` 是 string，需 `JSON.parse()` + try/catch，不能直接写入 OpenAPI schema object

### P1 实现细节

6. **`APIResponse.status` 是 number** — 需 `String()` 转换，OpenAPI 3.0 responses key 是 string
7. **3 处硬编码缺 `businessRules`** — DDSToolbar / DDSCanvasStore / DDSScrollContainer 均需 +1 行

---

## 开发约束

### 验证方法（强制）

- `grep` / `sed` / `wc` / `ls` — 直接对 `vibex-fronted/src/` 进行验证
- 不接受: 只读 architecture.md 就判断 GAP 已解决
- 必须: 实际运行命令确认类型/Exporter 在 `src/` 下存在

### 类型扩展顺序（P0 前置）

1. 先扩展 `ChapterType`（添加 `'businessRules'`）
2. 先扩展 `CardType`（添加 `'state-machine'`）
3. 先创建 `types/dds/state-machine.ts`
4. 然后才能修改 DDSToolbar / DDSCanvasStore / DDSScrollContainer

### HTTPMethod 兼容性（强制）

- `api-endpoint.ts` 的 `HTTPMethod` 保持大写（`GET/POST/...`）
- `APICanvasExporter` 内部执行 `card.method.toLowerCase()` 再传给 OpenAPIGenerator

### JSON Schema 处理（强制）

- `requestBody.schema` 是 string（MVP textarea）
- Exporter 执行 `JSON.parse(card.requestBody.schema as string)`
- 非法 JSON 时捕获异常，不崩溃

### Exporter 放置路径

- `APICanvasExporter` → `src/lib/contract/APICanvasExporter.ts`
- `SMExporter` → `src/lib/stateMachine/SMExporter.ts`
- 不修改 `OpenAPIGenerator.ts` 源码（方案C：patch Spec）

---

## 执行决策

- **决策**: 待评审（需要修改）
- **执行项目**: vibex-sprint4-qa
- **审查结论**: ❌ 需要修改
