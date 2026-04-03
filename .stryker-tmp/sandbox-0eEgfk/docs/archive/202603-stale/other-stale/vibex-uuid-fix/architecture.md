# Architecture - uuid 依赖修复

## 问题
`src/lib/guest/session.ts` 引入了 `uuid` 模块，但 `package.json` 中未声明该依赖。

## 解决方案
安装 `uuid` 和 `@types/uuid` 依赖。

## 影响范围
- 构建系统 (Cloudflare Pages)
- guest 会话管理

## 风险评估
- 风险: 低
- 回滚方案: 卸载 uuid 包
