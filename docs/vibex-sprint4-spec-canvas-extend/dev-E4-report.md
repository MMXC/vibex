# dev-E4 Report — Sprint4 E4: 导出功能

**Agent**: DEV
**Date**: 2026-04-18
**Commit**: 9a3e239d

## 产出清单

| Unit | 名称 | 文件 | 状态 |
|------|------|------|------|
| E4-U1 | APICanvasExporter | `src/services/dds/exporter.ts` | ✅ |
| E4-U2 | SMExporter | `src/services/dds/exporter.ts` | ✅ |
| E4-U3 | OpenAPI Export Modal | `src/components/dds/toolbar/DDSToolbar.tsx` | ✅ |
| E4-U4 | StateMachine Export Modal | `src/components/dds/toolbar/DDSToolbar.tsx` | ✅ |
| E4-U5 | 测试覆盖 | `src/services/dds/__tests__/exporter.test.ts` | ✅ |

## 实现说明

### E4-U1: APICanvasExporter
- `exportDDSCanvasData(cards, options)` 将 `APIEndpointCard[]` → OpenAPI 3.0.3 JSON
- 支持 method/path/summary/description/tags/parameters/requestBody/responses
- 收集 unique tags，自动 normalize path 以 `/` 开头

### E4-U2: SMExporter
- `exportToStateMachine(cards)` 将 `StateMachineCard[]` → StateMachine JSON
- 将 transitions 映射为 `states[id].on[event] = targetState`
- 多 card 合并去重，支持 initialState 回退

### E4-U3/U4: Export Modal
- 在 DDSToolbar leftSection 添加「导出」按钮
- Modal 显示 OpenAPI 3.0 + State Machine JSON 两个选项
- 点击即下载对应 JSON 文件

### E4-U5: 16 个测试用例
- E4-U5.1~E4-U5.5: OpenAPI export (版本/方法映射/空数组/null guard/summary)
- E4-U5.6~E4-U5.10: OpenAPI export (tags/title-version/requestBody/path normalize/responses)
- E4-U5.11~E4-U5.16: StateMachine export (states+initial/transitions/merge/empty/initial fallback)

## 验收标准

- [x] `expect(spec.openapi).toBe('3.0.3')`
- [x] `expect(spec.paths['/api/users'].get.summary).toBe('List users')`
- [x] 空数组导出空 paths
- [x] `expect(sm.initial).toBe('idle')`
- [x] transitions 映射到 `on` entries
- [x] 16 tests passing

## 边界情况

| # | 边界情况 | 处理方式 | 状态 |
|---|----------|----------|------|
| 1 | 空 cards 数组 | 返回 empty paths / states=[] | ✅ |
| 2 | null card in array | 跳过不崩溃 | ✅ |
| 3 | path 不以 / 开头 | 自动添加 / | ✅ |
| 4 | 无 initialState | 使用首个 state | ✅ |
| 5 | 多 card 重复 stateId | 去重保留第一个 | ✅ |
| 6 | 无 schema 的 response | 返回默认 200 response | ✅ |
