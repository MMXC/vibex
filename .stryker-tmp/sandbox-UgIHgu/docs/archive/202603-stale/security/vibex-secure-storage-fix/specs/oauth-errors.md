# Feature: OAuth 空 catch 块修复

## Jobs-To-Be-Done
- 作为用户，我希望 OAuth 操作失败时系统能明确告知我，以便我知道发生了什么并采取行动。

## Requirements
- [ ] (F1.1) oauth.ts 刷新 token 的 catch 块添加 console.error + provider 上下文
- [ ] (F1.2) oauth.ts 登出 revoke 的 catch 块添加 console.warn（登出错不阻塞登出）
- [ ] (F1.3) 刷新失败时返回 false（已有），确认有日志记录

## Acceptance Criteria
- [ ] AC1: expect(code).toContain('console.error') — 刷新失败有日志
- [ ] AC2: expect(code).toContain('console.warn') — revoke 失败有日志
- [ ] AC3: catch 块包含 error 对象引用（非空 catch）
