# AGENTS.md — OPTIONS CORS Fix

## 开发约束
- OPTIONS 必须返回 204，不能触发路由处理器
- CORS allow_methods 必须包含实际使用的 HTTP 方法
- 禁止硬编码特定 Origin（生产环境应配置）

*Architect Agent | 2026-04-07*
