# 分析: handleOptimize 未 try/catch

## 根因
`useHomePage.ts` 中 `handleOptimize` 调用 `optimizeRequirement` API 未包裹 try/catch，API 失败会抛出未处理错误。

## 修复
在 `handleOptimize` 中为 `optimizeRequirement` 调用添加 try/catch，捕获错误并显示用户友好的错误提示。

## 验收
expect(() => { api failure }).toThrow() 被 catch 捕获，无 unhandled error。
