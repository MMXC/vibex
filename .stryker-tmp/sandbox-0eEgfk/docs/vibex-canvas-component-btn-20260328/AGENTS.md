# AGENTS.md: vibex-canvas-component-btn-20260328

## dev 约束

### ✅ 必须做
- 使用现有 `canvasApi.ts` 的 fetch 封装，不重复造轮子
- 按钮 onClick 中检查 `isLoading` 防止重复提交
- 错误处理（try/catch + toast 提示）
- 按钮文案：「继续·组件树」

### ❌ 禁止做
- ❌ 不要修改 `flowData` 的来源逻辑
- ❌ 不要修改后端 `/component-tree/` 接口（除非 PRD 明确要求）
- ❌ 不要引入新的全局状态

## tester 约束
- ✅ 覆盖所有边界：空 flowData / 成功 / API 错误 / 超时
- ✅ network 监控验证 POST 请求体包含 flowData
- ✅ gstack 截图验证按钮和卡片

## reviewer 约束
- ✅ 检查 `isLoading` 防重锁
- ✅ 检查 API 错误处理
- ✅ 检查按钮 disabled 逻辑完整性
